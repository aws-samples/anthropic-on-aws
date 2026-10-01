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
    //
    // Also exclude .claude/** defensively: Claude Code (and this repo's own
    // agent tooling) can create scratch git worktrees under
    // .claude/worktrees/<name>/ for parallel dev work. Those are full
    // checkouts of this monorepo, including sibling samples under
    // development that may be independently broken/incomplete at any given
    // time. .claude/worktrees/ is already ignored via .git/info/exclude
    // (so `git status` looks clean), but that's a local-only, untracked
    // ignore rule -- it does nothing to stop vitest's own glob from
    // sweeping a stray worktree's test files into this project's "npm
    // test" run on anyone else's machine (or CI). Round 2 of this PR hit
    // exactly that: a leftover worktree produced 13 failed/16 passed test
    // files instead of the real 5/5, purely from unrelated sample code
    // dragged in by the default glob. This exclude is the actual fix;
    // removing the stray worktree (done in this same commit) is necessary
    // too, but on its own it doesn't protect the *next* stray worktree.
    exclude: ['**/node_modules/**', '**/cdk.out/**', '**/dist/**', '**/.claude/**'],
  },
});
