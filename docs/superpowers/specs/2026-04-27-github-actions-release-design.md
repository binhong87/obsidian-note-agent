# GitHub Actions Release Workflow — Design

## Goal

Automate production builds and GitHub releases for the Obsidian Note Agent plugin whenever a version tag is pushed.

## Trigger

Any tag push (e.g., `0.1.0`, `1.2.3`). No branch filter — tags are the release signal.

## Workflow steps

1. `actions/checkout@v4`
2. `actions/setup-node@v4` — Node 20 LTS
3. `npm ci` — clean install from lockfile
4. `npm run build` — `tsc --noEmit` + esbuild production bundle → outputs to `dist/`
5. `gh release create "$tag"` — creates the GitHub release and uploads assets

## Release assets

| File | Always? |
|---|---|
| `dist/main.js` | Yes |
| `manifest.json` (repo root) | Yes |
| `dist/styles.css` | Only if it exists (build is conditional on `main.css`) |

The `gh` CLI is pre-installed on `ubuntu-latest`; no local installation needed.

## Permissions

`permissions: contents: write` on the job — required for `gh release create`.

## First release

Tag: `0.1.0` (matches `manifest.json`). Push with:

```bash
git tag 0.1.0
git push origin 0.1.0
```

## Files to create

- `.github/workflows/release.yml`
