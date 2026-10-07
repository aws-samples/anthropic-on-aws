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

    // infra/test/stacks.test.ts's beforeAll runs real `cdk synth` (via
    // aws-cdk-lib) for 6 separate stack configurations, each bundling 2-3
    // Lambda handlers with esbuild. That's genuine, synchronous CPU work
    // -- no network/VPC lookups are involved (confirmed by code review:
    // no `Vpc.fromLookup`-style context lookups in platform-stack.ts, and
    // the test synths with a dummy `account: '111122223333'`). On this
    // machine it completes in ~9-10s; round 2 of this PR investigated a
    // report of it reproducibly taking ~90-100s and blowing past even a
    // 180000ms hookTimeout on another machine. That specific symptom
    // (configured hookTimeout being ignored) couldn't be reproduced here,
    // and no logic defect was found in the synth path -- most likely
    // explanation is raw CPU-speed variance between machines, compounded
    // by `pool: 'threads'` (the vitest default): a worker thread fully
    // blocked on long synchronous CPU work (CDK synth + esbuild) can't
    // service its own timer/RPC messages until that work yields back to
    // the event loop, which is a known rough edge for CPU-bound
    // synchronous `beforeAll` hooks under the threads pool. Switching to
    // `forks` (real child processes, no worker_threads/Atomics-based
    // control-channel involved) is the documented mitigation for exactly
    // this class of problem and should make the pool's own
    // thread-communication layer a non-factor regardless of synth speed.
    // Combined with a generous explicit hookTimeout as a second,
    // independent backstop (CI/sandbox machines are commonly slower than
    // a dev laptop), this is a defense-in-depth fix: if the forks switch
    // alone doesn't fully explain the other machine's symptom, the
    // explicit timeout still gives real synth work far more room than the
    // 10s default before being treated as hung.
    pool: 'forks',
    hookTimeout: 120_000,
  },
});
