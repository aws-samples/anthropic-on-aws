import { execFile } from 'node:child_process';
import {
  access,
  chmod,
  mkdir,
  readFile,
  writeFile,
} from 'node:fs/promises';
import * as path from 'node:path';
import { promisify } from 'node:util';
import {
  ACMClient,
  DescribeCertificateCommand,
  ImportCertificateCommand,
} from '@aws-sdk/client-acm';
import {
  CloudFormationClient,
  DescribeStacksCommand,
} from '@aws-sdk/client-cloudformation';
import {
  EC2Client,
  ExportClientVpnClientConfigurationCommand,
} from '@aws-sdk/client-ec2';
import { defaultProvider } from '@aws-sdk/credential-provider-node';

const execFileAsync = promisify(execFile);

export interface ClientVpnPki {
  directory: string;
  serverCertificateArn: string;
  clientRootCertificateArn: string;
  clientCertificatePath: string;
  clientPrivateKeyPath: string;
}

interface ClientVpnPkiOptions {
  region: string;
  profile: string;
  projectName: string;
  clientName: string;
  repositoryRoot: string;
}

interface ExportClientVpnOptions {
  region: string;
  profile: string;
  projectName: string;
  stackName: string;
  pki: ClientVpnPki;
}

interface PkiMetadata {
  version: 1;
  region: string;
  serverCertificateArn?: string;
  clientRootCertificateArn?: string;
}

export async function ensureClientVpnPki(
  options: ClientVpnPkiOptions,
): Promise<ClientVpnPki> {
  validateName(options.projectName, 'projectName');
  validateName(options.clientName, 'vpnClientName');

  const directory = path.join(
    options.repositoryRoot,
    '.build',
    'client-vpn',
    options.projectName,
  );
  await mkdir(directory, { recursive: true, mode: 0o700 });
  await chmod(directory, 0o700);

  const files = {
    caCertificate: path.join(directory, 'ca.crt'),
    caPrivateKey: path.join(directory, 'ca.key'),
    clientCertificate: path.join(directory, `${options.clientName}.crt`),
    clientPrivateKey: path.join(directory, `${options.clientName}.key`),
    metadata: path.join(directory, 'metadata.json'),
    serverCertificate: path.join(directory, 'server.crt'),
    serverPrivateKey: path.join(directory, 'server.key'),
  };
  const requiredFiles = [
    files.caCertificate,
    files.caPrivateKey,
    files.clientCertificate,
    files.clientPrivateKey,
    files.serverCertificate,
    files.serverPrivateKey,
  ];
  const present = await Promise.all(requiredFiles.map(fileExists));
  if (present.some(Boolean) && !present.every(Boolean)) {
    throw new Error(
      `Client VPN PKI is incomplete in ${directory}; ` +
        'remove the directory or restore all certificate files',
    );
  }
  if (!present.every(Boolean)) {
    await generatePki(directory, files, options);
  }

  const metadata = await readMetadata(files.metadata, options.region);
  const credentials = defaultProvider({ profile: options.profile });
  const acm = new ACMClient({
    region: options.region,
    credentials,
  });
  const serverCertificateArn = await ensureImportedCertificate(
    acm,
    metadata.serverCertificateArn,
    files.serverCertificate,
    files.serverPrivateKey,
    files.caCertificate,
    options.projectName,
    'server',
  );
  const clientRootCertificateArn = await ensureImportedCertificate(
    acm,
    metadata.clientRootCertificateArn,
    files.clientCertificate,
    files.clientPrivateKey,
    files.caCertificate,
    options.projectName,
    'client-root',
  );

  await writeFile(
    files.metadata,
    `${JSON.stringify(
      {
        version: 1,
        region: options.region,
        serverCertificateArn,
        clientRootCertificateArn,
      } satisfies PkiMetadata,
      null,
      2,
    )}\n`,
    { mode: 0o600 },
  );
  await chmod(files.metadata, 0o600);

  return {
    directory,
    serverCertificateArn,
    clientRootCertificateArn,
    clientCertificatePath: files.clientCertificate,
    clientPrivateKeyPath: files.clientPrivateKey,
  };
}

export async function exportClientVpnProfile(
  options: ExportClientVpnOptions,
): Promise<string> {
  const credentials = defaultProvider({ profile: options.profile });
  const cloudFormation = new CloudFormationClient({
    region: options.region,
    credentials,
  });
  const stack = await cloudFormation.send(
    new DescribeStacksCommand({ StackName: options.stackName }),
  );
  const endpointId = stack.Stacks?.[0]?.Outputs?.find(
    (output) => output.OutputKey === 'ClientVpnEndpointId',
  )?.OutputValue;
  if (!endpointId) {
    throw new Error(
      `Stack ${options.stackName} has no ClientVpnEndpointId output`,
    );
  }

  const ec2 = new EC2Client({
    region: options.region,
    credentials,
  });
  const exported = await ec2.send(
    new ExportClientVpnClientConfigurationCommand({
      ClientVpnEndpointId: endpointId,
    }),
  );
  const baseConfiguration = exported.ClientConfiguration?.trim();
  if (!baseConfiguration) {
    throw new Error('AWS returned an empty Client VPN configuration');
  }
  if (
    baseConfiguration.includes('<cert>') ||
    baseConfiguration.includes('<key>')
  ) {
    throw new Error(
      'AWS Client VPN configuration unexpectedly contains client credentials',
    );
  }

  const [certificate, privateKey] = await Promise.all([
    readFile(options.pki.clientCertificatePath, 'utf8'),
    readFile(options.pki.clientPrivateKeyPath, 'utf8'),
  ]);
  const profile = [
    baseConfiguration,
    'auth-nocache',
    '<cert>',
    certificate.trim(),
    '</cert>',
    '<key>',
    privateKey.trim(),
    '</key>',
    '',
  ].join('\n');
  const outputPath = path.join(
    options.pki.directory,
    `${options.projectName}.ovpn`,
  );
  await writeFile(outputPath, profile, { mode: 0o600 });
  await chmod(outputPath, 0o600);
  return outputPath;
}

async function generatePki(
  directory: string,
  files: {
    caCertificate: string;
    caPrivateKey: string;
    clientCertificate: string;
    clientPrivateKey: string;
    serverCertificate: string;
    serverPrivateKey: string;
  },
  options: ClientVpnPkiOptions,
): Promise<void> {
  const serverRequest = path.join(directory, 'server.csr');
  const clientRequest = path.join(directory, `${options.clientName}.csr`);
  const serverExtensions = path.join(directory, 'server.ext');
  const clientExtensions = path.join(directory, 'client.ext');
  await Promise.all([
    writeFile(
      serverExtensions,
      [
        'basicConstraints=critical,CA:FALSE',
        'keyUsage=critical,digitalSignature,keyEncipherment',
        'extendedKeyUsage=serverAuth',
        `subjectAltName=DNS:server.${options.projectName}.client-vpn.internal`,
        '',
      ].join('\n'),
      { mode: 0o600 },
    ),
    writeFile(
      clientExtensions,
      [
        'basicConstraints=critical,CA:FALSE',
        'keyUsage=critical,digitalSignature,keyEncipherment',
        'extendedKeyUsage=clientAuth',
        `subjectAltName=DNS:${options.clientName}.${options.projectName}.client-vpn.internal`,
        '',
      ].join('\n'),
      { mode: 0o600 },
    ),
  ]);

  await runOpenSsl(
    ['genrsa', '-out', files.caPrivateKey, '2048'],
    directory,
  );
  await runOpenSsl(
    [
      'req',
      '-x509',
      '-new',
      '-sha256',
      '-days',
      '3650',
      '-key',
      files.caPrivateKey,
      '-subj',
      `/CN=${options.projectName}-client-vpn-ca`,
      '-out',
      files.caCertificate,
    ],
    directory,
  );
  await runOpenSsl(
    ['genrsa', '-out', files.serverPrivateKey, '2048'],
    directory,
  );
  await runOpenSsl(
    [
      'req',
      '-new',
      '-sha256',
      '-key',
      files.serverPrivateKey,
      '-subj',
      `/CN=server.${options.projectName}.client-vpn.internal`,
      '-out',
      serverRequest,
    ],
    directory,
  );
  await runOpenSsl(
    [
      'x509',
      '-req',
      '-sha256',
      '-days',
      '825',
      '-in',
      serverRequest,
      '-CA',
      files.caCertificate,
      '-CAkey',
      files.caPrivateKey,
      '-CAcreateserial',
      '-CAserial',
      path.join(directory, 'ca.srl'),
      '-extfile',
      serverExtensions,
      '-out',
      files.serverCertificate,
    ],
    directory,
  );
  await runOpenSsl(
    ['genrsa', '-out', files.clientPrivateKey, '2048'],
    directory,
  );
  await runOpenSsl(
    [
      'req',
      '-new',
      '-sha256',
      '-key',
      files.clientPrivateKey,
      '-subj',
      `/CN=${options.clientName}.${options.projectName}.client-vpn.internal`,
      '-out',
      clientRequest,
    ],
    directory,
  );
  await runOpenSsl(
    [
      'x509',
      '-req',
      '-sha256',
      '-days',
      '825',
      '-in',
      clientRequest,
      '-CA',
      files.caCertificate,
      '-CAkey',
      files.caPrivateKey,
      '-CAcreateserial',
      '-CAserial',
      path.join(directory, 'ca.srl'),
      '-extfile',
      clientExtensions,
      '-out',
      files.clientCertificate,
    ],
    directory,
  );
  await Promise.all([
    chmod(files.caPrivateKey, 0o600),
    chmod(files.serverPrivateKey, 0o600),
    chmod(files.clientPrivateKey, 0o600),
  ]);
}

async function ensureImportedCertificate(
  acm: ACMClient,
  existingArn: string | undefined,
  certificatePath: string,
  privateKeyPath: string,
  chainPath: string,
  projectName: string,
  purpose: string,
): Promise<string> {
  if (existingArn && (await certificateExists(acm, existingArn))) {
    return existingArn;
  }
  const [certificate, privateKey, certificateChain] = await Promise.all([
    readFile(certificatePath),
    readFile(privateKeyPath),
    readFile(chainPath),
  ]);
  const imported = await acm.send(
    new ImportCertificateCommand({
      Certificate: certificate,
      PrivateKey: privateKey,
      CertificateChain: certificateChain,
      Tags: [
        { Key: 'Project', Value: projectName },
        { Key: 'ManagedBy', Value: 'claude-microvm-deployer' },
        { Key: 'Purpose', Value: `client-vpn-${purpose}` },
      ],
    }),
  );
  if (!imported.CertificateArn) {
    throw new Error(`ACM did not return the imported ${purpose} ARN`);
  }
  return imported.CertificateArn;
}

async function certificateExists(
  acm: ACMClient,
  certificateArn: string,
): Promise<boolean> {
  try {
    const result = await acm.send(
      new DescribeCertificateCommand({
        CertificateArn: certificateArn,
      }),
    );
    return result.Certificate?.Status === 'ISSUED';
  } catch (error) {
    if (
      error instanceof Error &&
      error.name === 'ResourceNotFoundException'
    ) {
      return false;
    }
    throw error;
  }
}

async function readMetadata(
  filename: string,
  region: string,
): Promise<PkiMetadata> {
  if (!(await fileExists(filename))) {
    return { version: 1, region };
  }
  const parsed = JSON.parse(await readFile(filename, 'utf8')) as unknown;
  if (
    !parsed ||
    typeof parsed !== 'object' ||
    Array.isArray(parsed) ||
    (parsed as PkiMetadata).version !== 1 ||
    (parsed as PkiMetadata).region !== region
  ) {
    throw new Error(
      `Client VPN PKI metadata is invalid or belongs to another Region: ${filename}`,
    );
  }
  return parsed as PkiMetadata;
}

let opensslBinary: string | undefined;

async function resolveOpenSsl(): Promise<string> {
  if (opensslBinary) {
    return opensslBinary;
  }
  const candidates = [
    'openssl',
    ...(process.platform === 'win32'
      ? [
          'C:\\Program Files\\Git\\usr\\bin\\openssl.exe',
          'C:\\Program Files\\Git\\mingw64\\bin\\openssl.exe',
        ]
      : []),
  ];
  for (const candidate of candidates) {
    try {
      await execFileAsync(candidate, ['version'], {
        maxBuffer: 1024 * 1024,
      });
      opensslBinary = candidate;
      return candidate;
    } catch {
      // Try the next candidate.
    }
  }
  throw new Error(
    'OpenSSL was not found. Install Git for Windows (which bundles ' +
      'openssl.exe under C:\\Program Files\\Git) or add OpenSSL to PATH, ' +
      'then rerun the deployment.',
  );
}

async function runOpenSsl(
  args: string[],
  cwd: string,
): Promise<void> {
  const openssl = await resolveOpenSsl();
  try {
    // Run inside the PKI output directory so side-effect files such as
    // the -CAcreateserial serial file land under .build/ instead of the
    // repository root.
    await execFileAsync(openssl, args, {
      cwd,
      maxBuffer: 1024 * 1024,
    });
  } catch (error) {
    throw new Error(
      `OpenSSL failed: ${error instanceof Error ? error.message : 'unknown error'}`,
    );
  }
}

async function fileExists(filename: string): Promise<boolean> {
  try {
    await access(filename);
    return true;
  } catch {
    return false;
  }
}

function validateName(value: string, name: string): void {
  if (!/^[A-Za-z0-9][A-Za-z0-9-]{1,62}$/.test(value)) {
    throw new Error(
      `${name} must contain 2-63 letters, numbers, or hyphens`,
    );
  }
}
