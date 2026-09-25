# Maintainers

This document describes who can merge what in this repository, and how a
release is made. It exists so that the community can keep Gladys moving when
the lead maintainer is away: trusted members can review and merge simple pull
requests (fixes, new devices, internal integrations) and ship patch releases
on their own, while everything else waits for the maintainers.

The rules below are enforced by GitHub wherever GitHub can enforce them
(teams, `CODEOWNERS`, the `master` ruleset, the release workflows). The rest is
a matter of trust between the people holding an access, and is written down
here so that everyone applies the same rules.

## Teams

All access to the repository goes through teams of the GladysAssistant
organization. Nobody is added to the repository as an individual collaborator.

| Team | Repository role | Who | Scope |
| --- | --- | --- | --- |
| `@GladysAssistant/maintainers` | Maintain | The lead maintainer, and `gladys-maintainer-bot`, a machine account they operate (see [Automatic approval](#automatic-approval-of-the-maintainers-pull-requests)) | Everything: features, fixes, data model, Gladys Plus, dependencies, CI, releases of any kind. Default owner of every file. |
| `@GladysAssistant/core` | Write | Trusted community maintainers | Fixes in the core, new devices and fixes in the internal integrations, translations, tests. No large feature, no data model change, no Gladys Plus, no dependency. |
| `@GladysAssistant/release` | Write | The lead maintainer and a backup | Approve the release pull requests, so that a patch release can ship without the lead maintainer. |
| `@GladysAssistant/triage` | Triage | Active community contributors | Label and close issues, request reviews, no push. |

Repository administration (rulesets, secrets, bypass) stays with the
organization owners and is not delegated.

## Pull request rules

The `master` branch is protected by a ruleset: a pull request is the only
way in, it needs one approval, the reviews are dismissed when new commits are
pushed, the required CI checks have to pass, and merges go through the merge
queue as squash commits.

On top of that, `.github/CODEOWNERS` requires the approval of a **code owner**
of every file the pull request touches. The file is an allowlist:

1. every file belongs to `maintainers`;
2. the areas open to `core` are listed explicitly: `server/lib`,
   `server/api`, `server/services`, `server/utils`, `server/test`,
   `front/src`, `front/cypress`;
3. inside those areas, the sensitive paths are closed again to
   `maintainers`: migrations and models, Gladys Plus (server gateway, its
   controller, and the front gateway routes, the settings pages for Gladys
   Plus, backups, billing and security, components, actions and utils),
   authentication and sessions, HTTP server, system
   control (libs, controllers and the front settings pages), external
   integrations framework and its controllers, `server/utils/constants.js`,
   every `package.json` and lockfile including the ones of the
   integrations, `docs/specs`, `AGENTS.md`, `.github`, `docker`;
4. the root `package.json` and lockfile, which carry the version, are open
   to `release`.

Anything not listed in step 2 (a new top-level directory, `docker`, the
documentation specs...) is maintainers-only until it is opened there.

A few consequences worth knowing:

- **You can never approve your own pull request.** A core member's PR needs
  another core member (or a maintainer), and a release PR opened by the
  backup needs the other member of `release`. The lead maintainer's own
  pull requests are approved by `gladys-maintainer-bot`, see
  [Automatic approval](#automatic-approval-of-the-maintainers-pull-requests).
- **A review bot's approval does not count.** `cursor[bot]` and
  `coderabbitai[bot]` review every pull request and may approve it; they are
  not code owners, so a human approval is still required. Their review is an
  input for your own review, not a replacement for it.
- **A "changes requested" review blocks the merge** until its author
  re-reviews or a maintainer dismisses it. Do not leave one behind when you
  go away: switch it to a comment or dismiss it yourself.

## What the core team can merge

With another core member's approval, a member of `core` merges on their own:

- bug fixes in the server and the front;
- new Zigbee2MQTT, Z-Wave, Matter, Tuya, Xiaomi... devices, mappings and
  exposes inside an existing integration;
- fixes and small improvements to an existing internal integration under
  `server/services/`;
- translations, and documentation inside the areas open to `core` (the
  `README.md` and `docs/` are maintainers-only);
- tests, lint and small refactors that do not change behavior.

`CODEOWNERS` cannot tell a fix from a feature on the same file, so the
following wait for a maintainer even when the paths are open:

- a new feature of any size in the core (dashboard, scenes, devices, chat,
  calendar...), or a new integration;
- a new device feature category or type (`DEVICE_FEATURE_CATEGORIES`,
  `DEVICE_FEATURE_TYPES`), which is a contract for every integration and is
  closed anyway through `server/utils/constants.js`;
- a change in a behavior or a contract covered by a living spec in
  `docs/specs/` (the spec has to change in the same pull request);
- a breaking change of any kind (API, database, dashboard boxes, scene
  actions), or a change in the upgrade path;
- anything you are not comfortable being the last human to have read.

When in doubt, leave the `needs:human-review` label on the pull request and
ask in the PR: a slower merge is always cheaper than a bad release.

## Review checklist

Before approving a pull request in the core scope:

1. CI is green on the latest commit, including the Codecov patch coverage.
2. The automated review (Cursor, CodeRabbit) has run on the latest commit and
   its findings are addressed or answered.
3. You have read the whole diff and understood it: pull requests that look
   like unreviewed AI output are sent back, see `CONTRIBUTING.md`.
4. The description links the forum topic (`Forum: https://...`) or the
   issue (`Closes #...`) when one exists, so the release automations can
   notify and close it.
5. The change is a fix, a device or an integration change, not a feature in
   disguise.

Merge with the merge queue ("Merge when ready"), never by bypassing it.

## Releases

Every merge on `master` is released through a version bump: the "Create
release tag" workflow tags `master` as soon as the version in `package.json`
changes, and that tag builds and publishes the production Docker images. The
version field is therefore never edited in an ordinary pull request.

Two entry points prepare a release, in the **Actions** tab:

| Workflow | Bump | Who may start it |
| --- | --- | --- |
| **Prepare patch release** | `X.Y.Z` → `X.Y.Z+1`, fixes only | Anyone with write access |
| **Prepare minor / major release** | `X.Y.Z` → `X.Y+1.0` or `X+1.0.0` | The logins listed in the workflow file (`RELEASE_MANAGERS`): the lead maintainer only, on purpose. This list is independent of the `release` team, which approves release pull requests but does not start minor or major releases. |

Both create a `release/vX.Y.Z` branch with the version bump and stop there.
Then:

1. A human opens the release pull request from that branch (the link is in
   the workflow summary). GitHub does not run the required checks on a pull
   request opened by the workflow token, so it cannot be automated.
2. A member of `release` (or a maintainer) who is **not** the author of that
   pull request approves it: the root `package.json` is owned by `release`.
3. The pull request is merged through the merge queue. The tag, the
   production images, the demo website and the API documentation follow
   automatically.

Practical rule for a patch release while the lead maintainer is away: a
member of `core` starts the workflow and opens the pull request, the backup
member of `release` reviews and approves it.

A patch release contains fixes only. Anything that adds a feature, a device
category, an integration or a migration waits for a minor release, and
therefore for a maintainer.

## Bots and automations

### Automatic approval of the maintainer's pull requests

The `maintainers` team is one person, and GitHub never lets an author
approve their own pull request. The workflow
`.github/workflows/auto-approve-maintainer-prs.yml` therefore approves, as
`gladys-maintainer-bot`, every commit that:

- belongs to a pull request targeting `master` from a branch of this
  repository (drafts included), opened by the lead maintainer;
- was pushed by the lead maintainer. The workflow only runs when a pull
  request is opened or receives a push, and only when the pusher is the
  author: marking a draft ready or reopening a pull request never triggers
  an approval, so a head pushed by someone else stays unapproved whatever
  happens next;
- is still the head of the pull request when the approval is posted.

A push by anyone else is never approved, and the ruleset dismisses the
previous approval ("dismiss stale reviews"). The ruleset also has to require
approval of the most recent reviewable push (see the setup notes in the pull
request that introduced this file): without that option, an approval of an
older commit could still count after a later push, so it is part of the
mechanism, not optional hygiene.

The approval is pinned to the reviewed commit and does not merge anything:
the merge queue, the required checks and the merge click are unchanged. The
lead maintainer remains the only person who can land a change on a
maintainers-only path, with or without the bot.

The bot token is not a repository secret: it lives in the
`maintainer-auto-approve` environment, whose deployment branch policy only
allows `master`, so a workflow edited on a branch can never read it. That
workflow never checks out the pull request and is the only one allowed to
reference the environment. Pull requests pushed by Claude sessions under the
lead maintainer's identity are approved too: read them before merging, and
do not enable auto-merge on one that touches a maintainers-only path
without having read it.

### Review and fix bots

- **Automated reviews** (`/cursor review`, CodeRabbit) run on every pull
  request, see `CONTRIBUTING.md`. Core members can trigger one with the
  `needs:cursor-review` label.
- **Claude autofix** (`.github/CLAUDE_AUTOFIX.md`) runs on the lead
  maintainer's account and pushes to `claude/` branches under their identity.
  Only the logins listed in `claude-on-demand-autofix.yml` can use the
  `/claude` command. If a session misbehaves (loops, pushes what it should
  not), close the pull request or remove its branch: the session stops with
  it.
- **ARM64 preview images** are built on request with `/build-arm64`,
  available to every organization member.

## Emergencies

- **Security report** received through the private channels of
  `SECURITY.md`: acknowledge it, keep it private, and reach a maintainer
  before any public fix. A fix for a vulnerability is a patch release.
- **Broken release** (users cannot upgrade or Gladys does not start): revert
  the offending pull request on `master` through a normal pull request, then
  ship a patch release. Never rewrite `master` or delete a tag.
- **Leaked or suspicious `gladys-maintainer-bot` activity** (an approval on
  a pull request the lead maintainer did not push): revoke the token in the
  bot account, delete the `MAINTAINER_BOT_TOKEN` secret of the environment,
  and dismiss the approval. The workflow then fails closed.
- **Nobody from `release` is reachable**: the fix waits. A wrong release
  hurts more users than a late one.

## Onboarding and offboarding

A contributor joins `triage` after a few merged contributions, and `core`
once they have reviewed and been reviewed enough for the lead maintainer to
trust their judgement on the scope above. Two-factor authentication is
required by the organization.

Accesses are reviewed after every period of delegated maintenance, and
removed when a maintainer is no longer active. Losing an access is never a
judgement on the person: it only follows the activity.
