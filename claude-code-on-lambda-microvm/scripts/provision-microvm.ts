#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import {
  lstat,
  mkdtemp,
  readFile,
  readdir,
  readlink,
  rm,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ZipArchive, type Archiver } from 'archiver';
import {
  CloudFormationClient,
  DescribeStacksCommand,
  type Stack,
} from '@aws-sdk/client-cloudformation';
import {
  CreateNetworkConnectorCommand,
  DeleteNetworkConnectorCommand,
  GetNetworkConnectorCommand,
  LambdaCoreClient,
  UpdateNetworkConnectorCommand,
} from '@aws-sdk/client-lambda-core';
import {
  Architecture,
  CreateMicrovmImageCommand,
  DeleteMicrovmImageCommand,
  GetMicrovmImageCommand,
  LambdaMicrovmsClient,
  ListManagedMicrovmImagesCommand,
  ListMicrovmImagesCommand,
  TagResourceCommand,
  UpdateMicrovmImageCommand,
  type CreateMicrovmImageCommandInput,
} from '@aws-sdk/client-lambda-microvms';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import {
  GetParameterCommand,
  PutParameterCommand,
  SSMClient,
} from '@aws-sdk/client-ssm';
import { defaultProvider } from '@aws-sdk/credential-provider-node';
import { imageBuildConfiguration } from './microvm-image-config.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(here, '..');
const microvmDirectory = path.join(repositoryRoot, 'microvm');
const UNPROVISIONED = 'UNPROVISIONED';
const IMAGE_TAGS = {
  Project: 'claude-microvm',
  ManagedBy: 'claude-microvm-provisioner',
  ClaudeCodeVersion: '2.1.215',
  VscodeCliVersion: '1.129.1',
};

const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  printHelp();
  process.exit(0);
}
const command =
  args[0] && !args[0].startsWith('--') ? args.shift() : 'provision';
const region =
  takeOption(args, '--region') ??
  'us-east-1';
const profile = takeOption(args, '--profile') ?? 'default';
const stackName = takeOption(args, '--stack') ?? 'ClaudeMicrovmStack';
const baseImageOverride = takeOption(args, '--base-image-arn');
const memoryMib = positiveInteger(
  takeOption(args, '--memory-mib') ?? '4096',
  '--memory-mib',
);
const timeoutMinutes = positiveInteger(
  takeOption(args, '--timeout-minutes') ?? '60',
  '--timeout-minutes',
);
assertNoArguments(args);

if (!['provision', 'delete'].includes(command ?? '')) {
  throw new Error(`Unknown command: ${command}`);
}
if (![512, 1024, 2048, 4096, 8192].includes(memoryMib)) {
  throw new Error('--memory-mib must be one of 512, 1024, 2048, 4096, 8192');
}

const credentials = defaultProvider({ profile });
const clientConfiguration = { region, credentials };
const cloudFormation = new CloudFormationClient(clientConfiguration);
const core = new LambdaCoreClient(clientConfiguration);
const microvms = new LambdaMicrovmsClient(clientConfiguration);
const s3 = new S3Client(clientConfiguration);
const ssm = new SSMClient(clientConfiguration);
const deadline = Date.now() + timeoutMinutes * 60_000;

// Mirrors the historical `zip -r . -x ...` packaging: these top-level
// directories are omitted entirely and `*.pyc` files are omitted anywhere.
// Declared before the top-level entry point below so packageAndUploadSource
// never observes it in the temporal dead zone.
const EXCLUDED_ROOT_DIRECTORIES = new Set([
  '__pycache__',
  'dist',
  'node_modules',
  'tests',
]);

const stack = await loadStack();
const outputs = outputMap(stack);
const projectName =
  stack.Parameters?.find((parameter) => parameter.ParameterKey === 'ProjectName')
    ?.ParameterValue ?? 'claude-microvm';

if (command === 'delete') {
  await deleteResources();
} else {
  await provisionResources();
}

async function provisionResources(): Promise<void> {
  const connectorArn = await ensureNetworkConnector();
  await setParameter(requiredOutput('NetworkConnectorParameterName'), connectorArn);

  const source = await packageAndUploadSource();
  try {
    const baseImageArn =
      baseImageOverride ?? (await discoverManagedBaseImage());
    const imageArn = await createOrUpdateImage(
      baseImageArn,
      source.uri,
    );
    await setParameter(requiredOutput('ImageParameterName'), imageArn);

    process.stdout.write(
      [
        'MicroVM resources are ready.',
        `Network connector: ${connectorArn}`,
        `Image:             ${imageArn}`,
        `Source artifact:   ${source.uri}`,
      ].join('\n') + '\n',
    );
  } finally {
    await rm(source.temporaryDirectory, { recursive: true, force: true });
  }
}

async function deleteResources(): Promise<void> {
  const imageParameter = requiredOutput('ImageParameterName');
  const connectorParameter = requiredOutput('NetworkConnectorParameterName');
  const imageArn = await parameterValue(imageParameter);
  const connectorArn = await parameterValue(connectorParameter);

  if (imageArn !== UNPROVISIONED) {
    process.stdout.write(`Deleting MicroVM image ${imageArn}...\n`);
    try {
      await microvms.send(
        new DeleteMicrovmImageCommand({ imageIdentifier: imageArn }),
      );
      await waitForImageDeletion(imageArn);
    } catch (error) {
      if (!isNotFound(error)) {
        throw error;
      }
    }
    await setParameter(imageParameter, UNPROVISIONED);
  }

  if (connectorArn !== UNPROVISIONED) {
    process.stdout.write(`Deleting network connector ${connectorArn}...\n`);
    try {
      await core.send(
        new DeleteNetworkConnectorCommand({ Identifier: connectorArn }),
      );
      await waitForConnectorDeletion(connectorArn);
    } catch (error) {
      if (!isNotFound(error)) {
        throw error;
      }
    }
    await setParameter(connectorParameter, UNPROVISIONED);
  }
  process.stdout.write('MicroVM image and connector are deleted.\n');
}

async function ensureNetworkConnector(): Promise<string> {
  const parameterName = requiredOutput('NetworkConnectorParameterName');
  const subnets = requiredOutput('IsolatedSubnetIds')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  if (subnets.length === 0) {
    throw new Error('Stack output IsolatedSubnetIds is empty');
  }
  const securityGroup = requiredOutput(
    'MicrovmConnectorSecurityGroupId',
  );
  const operatorRole = requiredOutput('ConnectorOperatorRoleArn');
  const configuration = {
    VpcEgressConfiguration: {
      SubnetIds: subnets,
      SecurityGroupIds: [securityGroup],
      NetworkProtocol: 'IPv4' as const,
      AssociatedComputeResourceTypes: ['MicroVm' as const],
    },
  };
  const existingArn = await parameterValue(parameterName);
  if (existingArn !== UNPROVISIONED) {
    try {
      let existing = await core.send(
        new GetNetworkConnectorCommand({ Identifier: existingArn }),
      );
      if (
        existing.State !== 'ACTIVE' ||
        existing.LastUpdateStatus === 'InProgress'
      ) {
        await waitForConnector(existingArn);
        existing = await core.send(
          new GetNetworkConnectorCommand({ Identifier: existingArn }),
        );
      }
      if (
        connectorConfigurationMatches(
          existing.Configuration?.VpcEgressConfiguration,
          existing.OperatorRole,
          configuration.VpcEgressConfiguration,
          operatorRole,
        )
      ) {
        return existingArn;
      }
      process.stdout.write(
        `Updating network connector ${existingArn} for the deployed VPC configuration...\n`,
      );
      await core.send(
        new UpdateNetworkConnectorCommand({
          Identifier: existingArn,
          Configuration: configuration,
          OperatorRole: operatorRole,
          ClientToken: digest(
            JSON.stringify({
              existingArn,
              configuration,
              operatorRole,
              region,
            }),
          ),
        }),
      );
      return waitForConnector(existingArn);
    } catch (error) {
      if (!isNotFound(error)) {
        throw error;
      }
    }
  }

  const request = {
    Name: `${projectName}-egress`,
    Configuration: configuration,
    OperatorRole: operatorRole,
    ClientToken: digest(
      JSON.stringify({ projectName, subnets, securityGroup, region }),
    ),
    Tags: {
      Project: projectName,
      ManagedBy: 'claude-microvm-provisioner',
    },
  };
  process.stdout.write(`Creating network connector ${request.Name}...\n`);
  const created = await core.send(
    new CreateNetworkConnectorCommand(request),
  );
  if (!created.Arn) {
    throw new Error('CreateNetworkConnector returned no ARN');
  }
  return waitForConnector(created.Arn);
}

async function waitForConnector(connectorArn: string): Promise<string> {
  while (Date.now() < deadline) {
    const connector = await core.send(
      new GetNetworkConnectorCommand({ Identifier: connectorArn }),
    );
    if (
      connector.State === 'ACTIVE' &&
      connector.LastUpdateStatus !== 'InProgress'
    ) {
      if (connector.LastUpdateStatus === 'Failed') {
        throw new Error(
          'Network connector update failed: ' +
            `${connector.LastUpdateStatusReason ?? connector.LastUpdateStatusReasonCode ?? 'unknown'}`,
        );
      }
      return connectorArn;
    }
    if (
      connector.State === 'FAILED' ||
      connector.State === 'DELETE_FAILED'
    ) {
      throw new Error(
        `Network connector entered ${connector.State}: ` +
          `${connector.StateReason ?? connector.StateReasonCode ?? 'unknown'}`,
      );
    }
    await delay(5_000);
  }
  throw new Error('Timed out waiting for the network connector');
}

function connectorConfigurationMatches(
  current:
    | {
        SubnetIds?: string[];
        SecurityGroupIds?: string[];
        NetworkProtocol?: string;
        AssociatedComputeResourceTypes?: string[];
      }
    | undefined,
  currentOperatorRole: string | undefined,
  expected: {
    SubnetIds: string[];
    SecurityGroupIds: string[];
    NetworkProtocol: string;
    AssociatedComputeResourceTypes: string[];
  },
  expectedOperatorRole: string,
): boolean {
  return (
    currentOperatorRole === expectedOperatorRole &&
    current?.NetworkProtocol === expected.NetworkProtocol &&
    sameStringSet(current?.SubnetIds, expected.SubnetIds) &&
    sameStringSet(
      current?.SecurityGroupIds,
      expected.SecurityGroupIds,
    ) &&
    sameStringSet(
      current?.AssociatedComputeResourceTypes,
      expected.AssociatedComputeResourceTypes,
    )
  );
}

function sameStringSet(
  current: string[] | undefined,
  expected: string[],
): boolean {
  return (
    current?.length === expected.length &&
    [...current].sort().every(
      (value, index) => value === [...expected].sort()[index],
    )
  );
}

async function packageAndUploadSource(): Promise<{
  uri: string;
  temporaryDirectory: string;
}> {
  const temporaryDirectory = await mkdtemp(
    path.join(tmpdir(), 'claude-microvm-'),
  );
  const archive = path.join(temporaryDirectory, 'microvm-source.zip');
  await createSourceArchive(microvmDirectory, archive);
  const body = await readFile(archive);
  const checksum = createHash('sha256').update(body).digest();
  const key = `microvm/source-${checksum.toString('hex')}.zip`;
  const bucket = requiredOutput('ArtifactBucketName');
  process.stdout.write(`Uploading s3://${bucket}/${key}...\n`);
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ChecksumSHA256: checksum.toString('base64'),
      ContentType: 'application/zip',
      Metadata: {
        project: projectName,
        sourceSha256: checksum.toString('hex'),
      },
    }),
  );
  return {
    uri: `s3://${bucket}/${key}`,
    temporaryDirectory,
  };
}

async function createSourceArchive(
  sourceDirectory: string,
  archivePath: string,
): Promise<void> {
  const archive = new ZipArchive({ zlib: { level: 9 } });
  const output = createWriteStream(archivePath);
  const written = new Promise<void>((resolve, reject) => {
    output.once('close', resolve);
    output.once('error', reject);
    archive.once('error', reject);
  });
  archive.pipe(output);
  await addDirectoryEntries(archive, sourceDirectory, '');
  await archive.finalize();
  await written;
}

async function addDirectoryEntries(
  archive: Archiver,
  directory: string,
  prefix: string,
): Promise<void> {
  for (const entry of (await readdir(directory)).sort()) {
    if (
      (prefix === '' && EXCLUDED_ROOT_DIRECTORIES.has(entry)) ||
      entry.endsWith('.pyc')
    ) {
      continue;
    }
    const filename = path.join(directory, entry);
    const name = prefix === '' ? entry : `${prefix}/${entry}`;
    const stats = await lstat(filename);
    if (stats.isSymbolicLink()) {
      archive.symlink(
        name,
        await readlink(filename),
        stats.mode & 0o777,
      );
    } else if (stats.isDirectory()) {
      archive.append('', {
        name: `${name}/`,
        date: stats.mtime,
        mode: stats.mode & 0o777,
      });
      await addDirectoryEntries(archive, filename, name);
    } else if (stats.isFile()) {
      archive.file(filename, {
        name,
        date: stats.mtime,
        mode: stats.mode & 0o777,
      });
    }
  }
}

async function discoverManagedBaseImage(): Promise<string> {
  let nextToken: string | undefined;
  const images: string[] = [];
  do {
    const result = await microvms.send(
      new ListManagedMicrovmImagesCommand({
        maxResults: 50,
        nextToken,
      }),
    );
    images.push(
      ...(result.items ?? [])
        .map((item) => item.imageArn)
        .filter((arn): arn is string => Boolean(arn)),
    );
    nextToken = result.nextToken;
  } while (nextToken);

  const match = images.find((arn) => arn.endsWith(':microvm-image:al2023-1'));
  if (!match) {
    throw new Error(
      'No managed al2023-1 MicroVM base image was found in this Region; ' +
        'pass --base-image-arn explicitly',
    );
  }
  return match;
}

async function createOrUpdateImage(
  baseImageArn: string,
  sourceUri: string,
): Promise<string> {
  const buildConfiguration = imageBuildConfiguration(baseImageArn);
  const buildConnectorArn =
    buildConfiguration.egressNetworkConnectors?.[0];
  if (!buildConnectorArn) {
    throw new Error('Image build configuration has no egress connector');
  }
  const shared: Omit<
    CreateMicrovmImageCommandInput,
    'name' | 'tags' | 'clientToken'
  > = {
    baseImageArn,
    buildRoleArn: requiredOutput('BuildRoleArn'),
    codeArtifact: { uri: sourceUri },
    description:
      'Private Claude Code and VS Code Remote Tunnels developer environment',
    logging: {
      cloudWatch: {
        logGroup: requiredOutput('MicrovmLogGroupName'),
      },
    },
    cpuConfigurations: [{ architecture: Architecture.ARM_64 }],
    resources: [{ minimumMemoryInMiB: memoryMib }],
    ...buildConfiguration,
  };

  const imageParameter = requiredOutput('ImageParameterName');
  let existingArn = await parameterValue(imageParameter);
  if (existingArn === UNPROVISIONED) {
    const discovered = await findImageByName(
      `${projectName}-claude-code`,
    );
    if (
      discovered?.state === 'CREATE_FAILED' ||
      discovered?.state === 'UPDATE_FAILED' ||
      discovered?.state === 'DELETE_FAILED'
    ) {
      process.stdout.write(
        `Deleting failed MicroVM image ${discovered.imageArn}...\n`,
      );
      await microvms.send(
        new DeleteMicrovmImageCommand({
          imageIdentifier: discovered.imageArn,
        }),
      );
      await waitForImageDeletion(discovered.imageArn);
    } else if (discovered?.imageArn) {
      existingArn = discovered.imageArn;
    }
  }
  let imageArn: string;
  if (existingArn === UNPROVISIONED) {
    process.stdout.write(`Creating MicroVM image ${projectName}-claude-code...\n`);
    const createRequest = {
      ...shared,
      name: `${projectName}-claude-code`,
      tags: {
        ...IMAGE_TAGS,
        Project: projectName,
      },
    };
    const created = await microvms.send(
      new CreateMicrovmImageCommand({
        ...createRequest,
        clientToken: digest(JSON.stringify(createRequest)),
      }),
    );
    if (!created.imageArn) {
      throw new Error('CreateMicrovmImage returned no ARN');
    }
    imageArn = created.imageArn;
  } else {
    imageArn = existingArn;
    process.stdout.write(`Updating MicroVM image ${imageArn}...\n`);
    const updateRequest = {
      ...shared,
      imageIdentifier: imageArn,
    };
    await microvms.send(
      new UpdateMicrovmImageCommand({
        ...updateRequest,
        clientToken: digest(JSON.stringify(updateRequest)),
      }),
    );
  }
  await waitForImage(imageArn);
  await microvms.send(
    new TagResourceCommand({
      Resource: imageArn,
      Tags: {
        ...IMAGE_TAGS,
        Project: projectName,
      },
    }),
  );
  return imageArn;
}

async function findImageByName(name: string): Promise<
  | {
      imageArn: string;
      state?: string;
    }
  | undefined
> {
  let nextToken: string | undefined;
  do {
    const result = await microvms.send(
      new ListMicrovmImagesCommand({
        maxResults: 50,
        nameFilter: name,
        nextToken,
      }),
    );
    const image = (result.items ?? []).find(
      (candidate) =>
        candidate.name === name && Boolean(candidate.imageArn),
    );
    if (image?.imageArn) {
      return { imageArn: image.imageArn, state: image.state };
    }
    nextToken = result.nextToken;
  } while (nextToken);
  return undefined;
}

async function waitForImage(imageArn: string): Promise<void> {
  while (Date.now() < deadline) {
    const image = await microvms.send(
      new GetMicrovmImageCommand({ imageIdentifier: imageArn }),
    );
    if (
      (image.state === 'CREATED' || image.state === 'UPDATED') &&
      image.latestActiveImageVersion
    ) {
      process.stdout.write(
        `Image version ${image.latestActiveImageVersion} is active.\n`,
      );
      return;
    }
    if (
      image.state === 'CREATE_FAILED' ||
      image.state === 'UPDATE_FAILED' ||
      image.state === 'DELETE_FAILED'
    ) {
      throw new Error(
        `MicroVM image entered ${image.state}. Check ` +
          `${requiredOutput('MicrovmLogGroupName')} in CloudWatch Logs.`,
      );
    }
    await delay(10_000);
  }
  throw new Error('Timed out waiting for the MicroVM image build');
}

async function waitForImageDeletion(imageArn: string): Promise<void> {
  while (Date.now() < deadline) {
    try {
      const image = await microvms.send(
        new GetMicrovmImageCommand({ imageIdentifier: imageArn }),
      );
      if (image.state === 'DELETE_FAILED') {
        throw new Error('MicroVM image deletion failed');
      }
    } catch (error) {
      if (isNotFound(error)) {
        return;
      }
      throw error;
    }
    await delay(5_000);
  }
  throw new Error('Timed out waiting for MicroVM image deletion');
}

async function waitForConnectorDeletion(connectorArn: string): Promise<void> {
  while (Date.now() < deadline) {
    try {
      const connector = await core.send(
        new GetNetworkConnectorCommand({ Identifier: connectorArn }),
      );
      if (connector.State === 'DELETE_FAILED') {
        throw new Error(
          `Network connector deletion failed: ` +
            `${connector.StateReason ?? 'unknown reason'}`,
        );
      }
    } catch (error) {
      if (isNotFound(error)) {
        return;
      }
      throw error;
    }
    await delay(5_000);
  }
  throw new Error('Timed out waiting for network connector deletion');
}

async function loadStack(): Promise<Stack> {
  const result = await cloudFormation.send(
    new DescribeStacksCommand({ StackName: stackName }),
  );
  const value = result.Stacks?.[0];
  if (!value) {
    throw new Error(`CloudFormation stack not found: ${stackName}`);
  }
  return value;
}

function outputMap(value: Stack): Map<string, string> {
  return new Map(
    (value.Outputs ?? []).flatMap((output) =>
      output.OutputKey && output.OutputValue
        ? [[output.OutputKey, output.OutputValue]]
        : [],
    ),
  );
}

function requiredOutput(name: string): string {
  const value = outputs.get(name);
  if (!value) {
    throw new Error(`Stack output is missing: ${name}`);
  }
  return value;
}

async function parameterValue(name: string): Promise<string> {
  const result = await ssm.send(new GetParameterCommand({ Name: name }));
  if (!result.Parameter?.Value) {
    throw new Error(`SSM parameter has no value: ${name}`);
  }
  return result.Parameter.Value;
}

async function setParameter(name: string, value: string): Promise<void> {
  await ssm.send(
    new PutParameterCommand({
      Name: name,
      Value: value,
      Type: 'String',
      Overwrite: true,
    }),
  );
}

function digest(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function isNotFound(error: unknown): boolean {
  return (
    error instanceof Error &&
    ['ResourceNotFoundException', 'NotFoundException'].includes(error.name)
  );
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function takeOption(values: string[], name: string): string | undefined {
  const index = values.indexOf(name);
  if (index < 0) {
    return undefined;
  }
  const value = values[index + 1];
  if (!value || value.startsWith('--')) {
    throw new Error(`${name} requires a value`);
  }
  values.splice(index, 2);
  return value;
}

function positiveInteger(value: string, name: string): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isSafeInteger(parsed) || parsed <= 0 || String(parsed) !== value) {
    throw new Error(`${name} must be a positive integer`);
  }
  return parsed;
}

function assertNoArguments(values: string[]): void {
  if (values.length > 0) {
    throw new Error(`Unexpected argument: ${values[0]}`);
  }
}

function printHelp(): void {
  process.stdout.write(`Usage: npm run provision -- [provision|delete] [options]

Commands:
  provision                         Create or update the connector and image
  delete                            Delete the image, then the connector

Options:
  --region <region>                 AWS Region (default: us-east-1)
  --profile <profile>               AWS profile (default: default)
  --stack <name>                    CloudFormation stack name
  --base-image-arn <arn>            Override managed AL2023 base discovery
  --memory-mib <mib>                512, 1024, 2048, 4096, or 8192
  --timeout-minutes <minutes>       Resource polling deadline (default: 60)
  --help                            Show this help without calling AWS
`);
}
