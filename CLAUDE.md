# CLAUDE.md

Guidance for Claude Code (and humans) contributing to `aws-samples/anthropic-on-aws`.
Subprojects with their own `CLAUDE.md` (e.g. `claude-apps-gateway/`) take precedence
for work inside them; this file covers the repo as a whole.

## What this repo is

A collection of **independent** samples, notebooks and workshops for using Anthropic's
Claude on AWS. Each top-level directory is its own project with its own README, stack,
dependencies and lifecycle. There is no shared library and no root build that exercises
the samples.

- `notebooks/` — model getting-started guides (`claude_<model>_getting_started/`) and
  feature notebooks. One notebook per directory.
- `cookbooks/` — focused recipes.
- Other top-level dirs — deployable demos (CDK, Lambda, AgentCore, Streamlit, Next.js).
- `docs/` + `mkdocs.yml` — the GitHub Pages site, published on every push to `main`.
- `.claude/skills/` — Claude Code skills shipped as samples (they are content, not
  repo tooling).

## Ground rules

- **One subproject per PR.** Don't touch other directories, and don't reformat files you
  aren't changing. Cross-cutting changes (CI, root docs) go in their own PR.
- **A human reviews and merges every PR** (aws-samples policy). Mergify is installed but
  deliberately inert (`.mergify.yml`); don't add rules or auto-merge.
- **Teach the supported path.** Samples look authoritative, so prefer documented
  Anthropic and AWS behavior over workarounds, and link the official docs instead of
  restating API behavior that will go stale. See the 1p-first guardrails in
  `claude-apps-gateway/CLAUDE.md`; they apply in spirit repo-wide.
- **Never commit** secrets, AWS account IDs, real ARNs, internal hostnames, customer
  data, or notebook outputs that contain any of these. Use placeholders such as
  `123456789012` and `example.com`.
- License is MIT-0. Don't add third-party code with an incompatible license.

## Conventions

- **Commit and PR titles:** Conventional Commits, scoped to the subproject directory:
  `fix(claude-apps-gateway): …`, `docs(notebooks): …`, `chore(deps): …`.
  Explain *why* in the body; reference the issue (`Fixes #N`) when there is one.
- **Model IDs:** use Bedrock model IDs and inference profiles (`global.`, or a geo prefix
  such as `us.`/`eu.`/`au.`). Prefixes differ by model and region, so check the current
  Bedrock inference-profile docs rather than copying from an older sample.
- **New model getting-started notebook:** copy the structure of the newest
  `notebooks/claude_*_getting_started/` directory, name it
  `claude_<family>_<major>_<minor>_getting_started/claude-<family>-<major>-<minor>-getting-started.ipynb`,
  and clear outputs that contain account-specific data before committing.
- **New subproject:** include a README (prereqs, deploy, cleanup, cost note), list it in
  the root `README.md`, and add it to `mkdocs.yml` / `docs/` if it should appear on the
  site.
- **Dependencies:** pin them in the subproject's own lockfile/requirements. Dependabot
  is security-only and grouped (`.github/dependabot.yml`); don't add routine version-bump
  configs.
- **GitHub Actions:** pin third-party actions to a full commit SHA with a `# vX.Y.Z`
  comment, matching `.github/workflows/`.

## Verification

Root CI (`build` workflow) only packs the repo and fails if the build changes tracked
files. **It does not test your sample**, so verify locally before opening a PR:

- Notebooks: run top to bottom against Bedrock in a clean kernel.
- CDK: `cdk synth` (and deploy + destroy if you changed resources).
- Subprojects with tests/scripts: run them (e.g. `claude-apps-gateway/test/*.sh`).
- Docs site changes: `mkdocs build` (see `.github/workflows/docbuild.yml` for plugins).

State what you ran in the PR description.
