# Maintainers

This document describes who can merge what in this repository, and how a
release is made. It exists so that the community can keep Gladys moving when
the lead maintainer is away: trusted members can review and merge simple pull
requests and ship patch releases on their own, while the riskier changes wait
for the release team.

The rules below are enforced by GitHub wherever GitHub can enforce them
(teams, `CODEOWNERS`, the `master` ruleset, the release workflows). The rest is
a matter of trust between maintainers, and is written down here so that
everyone applies the same rules.

## Teams and roles

All access to the repository goes through teams of the GladysAssistant
organization. Nobody is added to the repository as an individual collaborator.

| Team | Repository role | Who | What it allows |
| --- | --- | --- | --- |
| `@GladysAssistant/triage` | Triage | Active community contributors | Label and close issues, request reviews, no push. |
| `@GladysAssistant/core` | Write | Trusted maintainers | Push branches, approve and merge pull requests in the maintainer scope, start a patch release. |
| `@GladysAssistant/release` | Maintain | The lead maintainer and a backup | Everything above, plus approve the pull requests that touch the restricted paths, and approve release pull requests. |

Members of `release` are also members of `core`, so that one approval from
them covers a pull request touching both scopes.

Repository administration (rulesets, secrets, bypass) stays with the
organization owners and is not delegated.

## Pull request rules

The `master` branch is protected by a ruleset: a pull request is the only
way in, it needs one approval, the reviews are dismissed when new commits are
pushed, the required CI checks have to pass, and merges go through the merge
queue as squash commits.

On top of that, `.github/CODEOWNERS` requires the approval of a **code owner**
of every file the pull request touches:

- by default, any member of `core`;
- for the restricted paths listed in that file (release and build chain,
  dependencies, migrations and models, authentication, Gladys Plus gateway,
  system, device feature contract, living specs), a member of `release`.

A few consequences worth knowing:

- **You can never approve your own pull request.** A maintainer's PR needs
  another maintainer, and a release PR opened by the backup needs the lead
  maintainer (or the other way round).
- **A review bot's approval does not count.** `cursor[bot]` and
  `coderabbitai[bot]` review every pull request and may approve it; they are
  not code owners, so a human approval is still required. Their review is an
  input for your own review, not a replacement for it.
- **A "changes requested" review blocks the merge** until its author
  re-reviews or a member of `release` dismisses it. Do not leave one behind
  when you go away: switch it to a comment or dismiss it yourself.

## What a maintainer can merge

With another maintainer's approval, a member of `core` merges on their own:

- bug fixes;
- new Zigbee, Z-Wave, Matter, Tuya, Xiaomi... devices, mappings and exposes
  inside an existing integration;
- fixes and small improvements to an existing integration under
  `server/services/`;
- translations and documentation;
- tests, lint and small refactors that do not change behavior.

The following wait for a member of `release`, even when `CODEOWNERS` does not
catch them:

- a new device feature category or type (`DEVICE_FEATURE_CATEGORIES`,
  `DEVICE_FEATURE_TYPES`), which is a contract for every integration: check it
  against `docs/specs/device-feature-categories.md` first;
- a new integration, or a new dependency in an existing one
  (`server/services/*/package.json`);
- a change in a behavior or a contract covered by a living spec in
  `docs/specs/` (the spec has to change in the same pull request);
- a breaking change of any kind (API, database, dashboard boxes, scene
  actions), or a change in the upgrade path;
- anything you are not comfortable being the last human to have read.

When in doubt, leave the `needs:human-review` label on the pull request and
ask in the PR: a slower merge is always cheaper than a bad release.

## Review checklist

Before approving a pull request in the maintainer scope:

1. CI is green on the latest commit, including the Codecov patch coverage.
2. The automated review (Cursor, CodeRabbit) has run on the latest commit and
   its findings are addressed or answered.
3. You have read the whole diff and understood it: pull requests that look
   like unreviewed AI output are sent back, see `CONTRIBUTING.md`.
4. The description links the forum topic (`Forum: https://...`) or the
   issue (`Closes #...`) when one exists, so the release automations can
   notify and close it.
5. Nothing in the diff belongs to the restricted list above.

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
| **Prepare minor / major release** | `X.Y.Z` → `X.Y+1.0` or `X+1.0.0` | The release managers listed in the workflow file (`RELEASE_MANAGERS`) |

Both create a `release/vX.Y.Z` branch with the version bump and stop there.
Then:

1. A human opens the release pull request from that branch (the link is in
   the workflow summary). GitHub does not run the required checks on a pull
   request opened by the workflow token, so it cannot be automated.
2. A member of `release` who is **not** the author of that pull request
   approves it (`package.json` is a restricted path).
3. The pull request is merged through the merge queue. The tag, the
   production images, the demo website and the API documentation follow
   automatically.

Practical rule for a patch release while the lead maintainer is away: a
member of `core` starts the workflow and opens the pull request, the backup
member of `release` reviews and approves it.

A patch release contains fixes only. Anything that adds a feature, a device
category, an integration or a migration waits for a minor release, and
therefore for a release manager.

## Bots and automations

- **Automated reviews** (`/cursor review`, CodeRabbit) run on every pull
  request, see `CONTRIBUTING.md`. Maintainers can trigger one with the
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
  `SECURITY.md`: acknowledge it, keep it private, and reach the release team
  before any public fix. A fix for a vulnerability is a patch release.
- **Broken release** (users cannot upgrade or Gladys does not start): revert
  the offending pull request on `master` through a normal pull request, then
  ship a patch release. Never rewrite `master` or delete a tag.
- **A member of the release team is unreachable**: the other one decides. If
  both are, the fix waits; a wrong release hurts more users than a late one.

## Onboarding and offboarding

A contributor joins `triage` after a few merged contributions, and `core`
once they have reviewed and been reviewed enough for the lead maintainer to
trust their judgement on the scope above. Two-factor authentication is
required by the organization.

Accesses are reviewed after every period of delegated maintenance, and
removed when a maintainer is no longer active. Losing an access is never a
judgement on the person: it only follows the activity.
