# CLAUDE.md

Guidance for AI agents (and humans) working in this repo.

## Release pipeline — how it actually works

Three workflows fire on release-related events:

| Workflow | Trigger | What it does |
|---|---|---|
| `release-helm-chart.yml` | **every push to `main`** (+ manual dispatch) | chart-releaser packages `helm-chart/` if its `version:` changed since the last tag, creates the git tag `dashwright-X.Y.Z` + a GitHub release holding `dashwright-X.Y.Z.tgz`, and merges the entry into `index.yaml` on the `gh-pages` branch |
| `docker.yml` | push of tag `v*.*.*` | builds/pushes backend + frontend images tagged `X.Y.Z` |
| `publish-npm.yml` | push of tag `v*.*.*` | publishes `integrations/npm-package` |

The public Helm repo (`https://cybedefend.github.io/dashwright`) is just `index.yaml` on `gh-pages`; each entry's download URL points at a `dashwright-X.Y.Z` GitHub release asset. **Both must stay in sync** — an index entry whose release was deleted means a 404 for every `helm install`.

## Critical rules (learned the hard way — see incident below)

1. **Never bump `version:` in `helm-chart/Chart.yaml` outside a release commit.** The chart workflow runs on *every* push to `main`. Bumping `version:` alone in a fix/feature commit publishes that chart version immediately, with the old `appVersion` and old image tags baked in — the version number is then burned forever (see rule 3).

2. **A release commit must bump everything together, atomically:**
   - `backend/package.json`, `frontend/package.json`, `integrations/npm-package/package.json`
   - `helm-chart/Chart.yaml` → both `version:` **and** `appVersion:`
   - `helm-chart/values.yaml` → backend and frontend `tag:` values (lines ~10 and ~14 only — do NOT touch the postgres/minio tags)
   - `README.md` Helm badge (`Helm-vX.Y.Z`)

3. **A chart version is published exactly once — never try to re-release the same version.** chart-releaser runs with `skip_existing: true` and `cr index` never updates an entry that already exists in `index.yaml`. Re-running the workflow for an already-published version is a silent no-op (the run stays green). If a published chart is wrong, **bump to a new chart version**; don't fight the old one.

4. **Never create, delete, or force-push `dashwright-*` tags or releases manually.** chart-releaser owns them. `scripts/release.sh` used to create `dashwright-X.Y.Z` itself — that collided with the tag chart-releaser had already created and was removed; don't reintroduce it. Deleting a `dashwright-*` release does NOT trigger a re-publish (the workflow only runs on pushes to `main`) — it just breaks the published `index.yaml`.

5. **Verify after releasing** (a green run does not mean a chart was published — skips are silent):
   ```bash
   curl -s https://cybedefend.github.io/dashwright/index.yaml | grep -A2 "version: X.Y.Z"   # appVersion must match
   curl -sI -o /dev/null -w "%{http_code}\n" \
     https://github.com/CybeDefend/dashwright/releases/download/dashwright-X.Y.Z/dashwright-X.Y.Z.tgz   # must be 200
   ```

## How to release version X.Y.Z

Use `scripts/release.sh`, or manually:

```bash
# 1. bump all versions (see rule 2 for the file list)
# 2. single commit + ONE tag (chart-releaser creates dashwright-X.Y.Z itself)
git commit -m "chore: release version X.Y.Z"
git tag -a vX.Y.Z -m "Release X.Y.Z"
git push origin main --follow-tags
# 3. verify (rule 5)
```

## Incident 2026-06-03 — chart 1.2.21 broken (why these rules exist)

A fix commit bumped the chart `version:` to 1.2.21 without bumping `appVersion`/image tags → the workflow instantly published chart 1.2.21 pointing at app 1.2.20. The real release commit came 20 min later but `skip_existing` silently skipped re-publishing. Manual deletion of the `dashwright-1.2.21` tag/release (to "force" a re-release) didn't trigger anything and left `index.yaml` pointing at a deleted asset → every `helm install` of 1.2.21 returned 404. Resolution: stale 1.2.21 entry removed from `gh-pages` `index.yaml`, version bumped to 1.2.22.
