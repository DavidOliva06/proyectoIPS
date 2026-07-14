# CI/CD

## Pipelines

| Workflow                              | Trigger                                       | What it does                                   |
| ------------------------------------- | --------------------------------------------- | ---------------------------------------------- |
| [`ci.yml`](../.github/workflows/ci.yml)             | pushes to `develop`/`feature/**`, PRs to `master` | lint → typecheck → test+coverage → build       |
| [`cd.yml`](../.github/workflows/cd.yml)             | push to `master`, `v*.*.*` tags               | runs `ci.yml`, then builds and pushes the image |
| [`security.yml`](../.github/workflows/security.yml) | PRs, pushes to `master`, weekly                | dependency audit, secret scan, CodeQL          |

`cd.yml` does not re-declare the checks — it calls `ci.yml` as a reusable
workflow. "CI is green" and "we shipped it" therefore refer to the same checks by
construction, and cannot drift apart.

`ci.yml` deliberately does **not** run on pushes to `master`: those go through
`cd.yml`'s gate instead, so a merge produces one CI run rather than two racing
ones.

## Branch flow

```
develop  ──PR──▶  master  ──▶  CI gate  ──▶  ghcr.io image
feature/my-thing  ──┘
```

- `develop` is the integration branch; `feature/*` branches off `master` also run CI.
- Open a PR to `master`. CI must be green and the PR must be reviewed to merge.
- Merging to `master` deploys automatically.

Note the default branch here is `master`, not `main`.

## Deploy target

Images are pushed to `ghcr.io/davidoliva06/proyectoips`, authenticated with the
built-in `GITHUB_TOKEN` — no extra secrets needed.

| Ref                | Tags                                       |
| ------------------ | ------------------------------------------ |
| push to `master`   | `:master`, `:sha-<short>`                  |
| tag `v1.2.3`       | `:1.2.3`, `:1.2`, `:1`, `:latest`          |
| tag `v1.2.3-beta1` | `:1.2.3-beta1` only                        |

`:latest` is reserved for release tags, so a mainline push can never masquerade as
the newest release.

The `deploy` job runs in the `production` GitHub environment. Add required
reviewers or a wait timer under **Settings → Environments → production** to gate
shipping behind human approval.

## Quality gates

**Lint & format** — Biome (`pnpm lint:ci`), which covers what ESLint + Prettier
would; running all three would mean two formatters fighting over the same files.

**Typecheck** — `pnpm typecheck` runs [`scripts/typecheck.js`](../scripts/typecheck.js),
which tolerates the pre-existing errors recorded in `typecheck-baseline.json` and
fails on anything new. The debt is frozen rather than forgiven: a clean `tsc`
gate would have been red from day one (and then deleted), while no gate at all
lets new type errors in freely.

Fix a baseline error, then shrink the file:

```bash
pnpm typecheck:update   # rewrites the baseline
pnpm typecheck:raw      # full unfiltered tsc output
```

The baseline should only ever shrink. Growing it requires deliberately committing
a larger file, which is visible in review.

**Tests & coverage** — `pnpm test:coverage`. Coverage is enforced at 70% against
the `COVERED` allowlist in [`jest.config.ts`](../jest.config.ts), not the whole
tree: a repo-wide threshold would either sit so low it asserts nothing, or sit
high and fail immediately. Adding a module to `COVERED` is the act of committing
to keep it tested.

**Security** — `pnpm audit` (fails on high/critical only; the rest is Dependabot's
job), gitleaks over full history, and CodeQL. Dependabot batches minor/patch bumps
weekly per [`dependabot.yml`](../.github/dependabot.yml).

## Running the gates locally

```bash
pnpm verify   # lint:ci + typecheck + test:coverage — the same checks CI runs
```

## Branch protection

Not settable from a workflow file. Apply once with [`scripts/protect-branch.sh`](../scripts/protect-branch.sh),
or by hand under **Settings → Branches → Add rule** for `master`:

- Require a pull request before merging (1 approval)
- Require status checks to pass: **`Lint, typecheck, test, build`**
- Require branches to be up to date before merging
- Do not allow bypassing the above settings

## Line endings

`biome.json` requires LF. [`.gitattributes`](../.gitattributes) pins the working
tree to LF so a Windows checkout (`core.autocrlf=true`) does not produce CRLF that
fails `biome ci` locally while passing on the Linux runner.
