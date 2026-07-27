import { describe, expect, it } from 'vitest';
import { imageBuildConfiguration } from './microvm-image-config.js';

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
});
