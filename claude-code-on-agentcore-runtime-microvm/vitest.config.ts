import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Without an explicit exclude, vitest's default test glob also
    // matches copies of test files that CDK's NodejsFunction/asset
    // bundling leaves behind under cdk.out/asset.<hash>/ (each asset
    // bundle is built from a full copy of the repo, tests directory
    // included). Those are frozen snapshots from whenever `cdk synth`
    // last ran, not the current source -- running them alongside the
    // real suite produced confusing phantom failures/duplicates
    // throughout this project's end-to-end testing (a test edited in
    // infra/test/stacks.test.ts kept "failing" from a stale cdk.out
    // copy that still had the old assertion, even after the real fix
    // landed and the real copy passed).
    exclude: ['**/node_modules/**', '**/cdk.out/**', '**/dist/**'],
  },
});
