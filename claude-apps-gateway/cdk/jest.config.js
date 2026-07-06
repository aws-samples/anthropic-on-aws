// Jest config for the CDK stack tests. Uses ts-jest so tests are authored in
// TypeScript against the same construct types as the app, and the CDK
// `assertions` module (bundled in aws-cdk-lib) to assert on the synthesized
// CloudFormation template — no AWS account or credentials required.
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
};
