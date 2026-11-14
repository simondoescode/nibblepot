# Releasing Simmer

Simmer uses Semantic Versioning, starting from the existing `0.2.0` in `package.json`.

## Workflow

1. Merge changes into `main` using Conventional Commit PR titles or squash commit messages.
2. Release Please opens or updates a release pull request, calculating the next version and generating `CHANGELOG.md`.
3. Merge the release PR to publish a Git tag and GitHub Release.
4. The existing GitHub Pages workflow continues deploying **every** push to `main`, independently of releases. PRs run tests without deploying.

## Commit prefixes

- `fix: ...` — patch bump (e.g. 0.2.1).
- `feat: ...` — minor bump (e.g. 0.3.0).
- `feat!: ...` or `BREAKING CHANGE:` in the commit body — breaking change (while in 0.x, Release Please may advance the minor version).
- `docs:`, `chore:`, `test:` and `refactor:` — normally no version bump.

If PRs are squash-merged, use a Conventional Commit **PR title** as the squash commit title. Do not mark all PRs as `feat`, or the version will jump too often.

The version displayed in Settings comes directly from `package.json` and updates with releases. The release PR also updates the package lockfile.

## Repository setting

GitHub Actions must be allowed to create pull requests: **Settings → Actions → General → Workflow permissions → Allow GitHub Actions to create and approve pull requests**. The default `GITHUB_TOKEN` also needs the workflow's `contents: write` and `pull-requests: write` permissions.

If release PRs cannot be created with `GITHUB_TOKEN`, check repository or organisation policy; use an approved GitHub App token if needed. Releases created with `GITHUB_TOKEN` do not trigger other workflows, but our existing Pages deploy is already triggered by the merge to `main`.

## What's new in Settings

Simmer reads `CHANGELOG.md` at build time and displays up to three short updates per version under **Settings → What's new?**, newest first. All notes are bundled into the PWA so they are available offline. Only versions at or below the installed app version are visible.

When preparing a release, review the generated changelog in the Release Please PR. Keep the first three user-visible bullets friendly, brief and specific. Write for someone deciding what to cook, not for a developer reading commit hashes. For example:

- "Finding a meat-free dinner is now a piece of cake."
- "Your shopping list is a little smarter about leftovers."

The display removes issue numbers and links, and gives each release a friendly heading. Avoid developer jargon and do not add claims about unreleased features. The initial `0.2.0` notes are curated; future version sections are added automatically by Release Please.
