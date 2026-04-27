# GitHub Actions Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a GitHub Actions workflow that builds the plugin and publishes a GitHub release whenever a version tag is pushed.

**Architecture:** Single YAML workflow file at `.github/workflows/release.yml`. Triggered by any tag push. Runs `npm ci && npm run build` (outputs to `dist/`), then uses the pre-installed `gh` CLI to create the release and upload assets. `dist/styles.css` is uploaded only if it exists, since the build skips it when no `main.css` is present.

**Tech Stack:** GitHub Actions (`ubuntu-latest`), Node 20 LTS, npm, gh CLI (pre-installed on runner).

---

### Task 1: Create the workflow file

**Files:**
- Create: `.github/workflows/release.yml`

- [ ] **Step 1: Create the directory**

```bash
mkdir -p .github/workflows
```

- [ ] **Step 2: Write the workflow file**

Create `.github/workflows/release.yml` with this exact content:

```yaml
name: Release Obsidian plugin

on:
  push:
    tags:
      - "*"

jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: write

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: "20"

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Create release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          tag="${GITHUB_REF#refs/tags/}"
          files="dist/main.js manifest.json"
          if [ -f dist/styles.css ]; then
            files="$files dist/styles.css"
          fi
          gh release create "$tag" \
            --title="$tag" \
            --repo="${GITHUB_REPOSITORY}" \
            $files
```

- [ ] **Step 3: Verify YAML is valid**

```bash
npx js-yaml .github/workflows/release.yml
```

Expected: prints the parsed object with no errors. If `js-yaml` isn't installed, check indentation manually — YAML is whitespace-sensitive.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/release.yml
git commit -m "ci: add GitHub Actions release workflow"
```

---

### Task 2: Push the tag to trigger the first release

**Files:** (none — git operations only)

- [ ] **Step 1: Confirm the remote is set**

```bash
git remote -v
```

Expected: shows `origin` pointing to your GitHub repository (e.g., `https://github.com/binhong87/obsidian-note-agent.git`). If no remote exists, add one:

```bash
git remote add origin https://github.com/<your-username>/obsidian-note-agent.git
```

- [ ] **Step 2: Push the commit**

```bash
git push origin master
```

- [ ] **Step 3: Create and push the version tag**

```bash
git tag 0.1.0
git push origin 0.1.0
```

Expected: GitHub Actions workflow triggers within seconds. Navigate to `https://github.com/<your-username>/obsidian-note-agent/actions` to watch it run.

- [ ] **Step 4: Verify the release**

Navigate to `https://github.com/<your-username>/obsidian-note-agent/releases`. Confirm:
- Release `0.1.0` exists
- Assets include `main.js` and `manifest.json`
- `styles.css` present only if the build produced it
