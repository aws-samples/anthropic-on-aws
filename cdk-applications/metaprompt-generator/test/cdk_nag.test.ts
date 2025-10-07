import 'source-map-support/register';
import * as fs from 'fs';
import { App, Aspects, Stack } from 'aws-cdk-lib';
import { Annotations, Match } from 'aws-cdk-lib/assertions';
import { AwsSolutionsChecks } from 'cdk-nag';
import { AnthropicMetaPromptGenerator } from '../src/anthropic-metaprompt-generator';
import { applySuppressions } from '../src/nagSuppressions';

const props = {
  logLevel: process.env.LOG_LEVEL || '',
  allowedDomain: process.env.ALLOWED_DOMAIN || '',
  anthropicKey: process.env.ANTHROPIC_KEY || '',
};

let outputStream: fs.WriteStream;

describe('cdk-nag AwsSolutions Pack', () => {
  let stack: Stack;
  let app: App;

  beforeEach(() => {
    // GIVEN
    app = new App();
    stack = new AnthropicMetaPromptGenerator(
      app,
      'AmazonChimeSDKMeetingSummarizer',
      { ...props },
    );

    outputStream = fs.createWriteStream('cdk-nag-output.txt');
  });

  afterEach(() => {
    outputStream.end();
  });

  test('Output all Warnings and Errors', () => {
    // WHEN
    Aspects.of(stack).add(
      new AwsSolutionsChecks({
        verbose: true,
        logIgnores: false,
      }),
    );

    // THEN
    const warnings = Annotations.fromStack(stack).findWarning(
      '*',
      Match.stringLikeRegexp('AwsSolutions-.*'),
    );

    outputStream.write('All Warnings:\n');
    warnings.forEach((warning) => {
      outputStream.write(`${JSON.stringify(warning.entry.data, null, 2)}\n`);
    });

    const errors = Annotations.fromStack(stack).findError(
      '*',
      Match.stringLikeRegexp('AwsSolutions-.*'),
    );

    outputStream.write('All Errors:\n');
    errors.forEach((error) => {
      outputStream.write(`${JSON.stringify(error.entry.data, null, 2)}\n`);
    });
  });

  test('No unsuppressed Warnings or Errors after applying suppressions', () => {
    // GIVEN
    applySuppressions(stack);

    // WHEN
    Aspects.of(stack).add(
      new AwsSolutionsChecks({
        verbose: true,
        logIgnores: false,
      }),
    );

    // THEN
    const unsuppressedWarnings = Annotations.fromStack(stack).findWarning(
      '*',
      Match.stringLikeRegexp('AwsSolutions-.*'),
    );

    expect(unsuppressedWarnings).toHaveLength(0);

    const unsuppressedErrors = Annotations.fromStack(stack).findError(
      '*',
      Match.stringLikeRegexp('AwsSolutions-.*'),
    );

    expect(unsuppressedErrors).toHaveLength(0);
  });
});
