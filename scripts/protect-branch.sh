#!/usr/bin/env bash
#
# Applies branch protection to master. Requires the GitHub CLI, authenticated
# with a token carrying `repo` scope:
#
#   gh auth login
#   ./scripts/protect-branch.sh
#
# Branch protection cannot be declared in a workflow file, so this is the
# repeatable version of clicking through Settings > Branches.
set -euo pipefail

REPO="${REPO:-$(gh repo view --json nameWithOwner -q .nameWithOwner)}"
BRANCH="${BRANCH:-master}"

# Must match the `name:` of the job in ci.yml, which is what appears as a check.
CHECK="Lint, typecheck, test, build"

echo "Protecting ${BRANCH} on ${REPO}..."

gh api \
  --method PUT \
  -H "Accept: application/vnd.github+json" \
  "/repos/${REPO}/branches/${BRANCH}/protection" \
  --input - <<JSON
{
  "required_status_checks": {
    "strict": true,
    "checks": [{ "context": "${CHECK}" }]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "dismiss_stale_reviews": true
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
JSON

echo "Done. ${BRANCH} now requires a reviewed PR with '${CHECK}' green."
