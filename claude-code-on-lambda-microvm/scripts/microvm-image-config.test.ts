import { describe, expect, it } from 'vitest';
import toolVersions from '../microvm/tool-versions.json' with { type: 'json' };
import {
  imageBuildConfiguration,
  microvmToolVersionTags,
} from './microvm-image-config.js';

describe('imageBuildConfiguration', () => {
  it('uses managed internet egress only for the image build', () => {
    const configuration = imageBuildConfiguration(
      'arn:aws:lambda:ap-northeast-1:aws:microvm-image:al2023-1',
    );

    expect(configuration.egressNetworkConnectors).toEqual([
      'arn:aws:lambda:ap-northeast-1:aws:network-connector:' +
        'aws-network-connector:INTERNET_EGRESS',
    ]);
    expect(configuration.hooks?.microvmImageHooks).toMatchObject({
      readyTimeoutInSeconds: 300,
      validateTimeoutInSeconds: 300,
    });
    expect(configuration.hooks?.microvmHooks).toMatchObject({
      runTimeoutInSeconds: 60,
      resumeTimeoutInSeconds: 60,
      suspendTimeoutInSeconds: 60,
      terminateTimeoutInSeconds: 60,
    });
  });

  it('rejects a non-managed base image ARN', () => {
    expect(() =>
      imageBuildConfiguration(
        'arn:aws:lambda:us-east-1:111122223333:microvm-image:test',
      ),
    ).toThrow('Invalid managed MicroVM base image ARN');
  });

  it('derives image tags from the MicroVM tool-version manifest', () => {
    expect(microvmToolVersionTags()).toEqual({
      ClaudeCodeVersion: toolVersions.claudeCode.version,
      VscodeCliVersion: toolVersions.vscodeCli.version,
    });
    expect(toolVersions.claudeCode.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(toolVersions.vscodeCli.commit).toMatch(/^[a-f0-9]{40}$/);
    expect(toolVersions.vscodeCli.sha256).toMatch(/^[a-f0-9]{64}$/);
  });
});
