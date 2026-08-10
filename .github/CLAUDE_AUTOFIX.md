# Scheduled Claude autofix

`claude-scheduled-autofix.yml` runs once a day and launches Claude Code
**cloud sessions** (claude.ai/code) to address the review-bot feedback
(Cursor, CodeRabbit) left on open pull requests — with hard caps, and without
the runaway loop of the event-driven mode (Claude pushes → the bots re-review
→ Claude reacts again, forever).

## How it works

```
 select (bash + gh api, no LLM)      fire (matrix, one job per PR)      Anthropic cloud
 ┌────────────────────────────┐      ┌─────────────────────────────┐    ┌─────────────────────────┐
 │ list open PRs              │      │ POST the routine /fire API  │    │ new Claude Code session │
 │ apply eligibility rules    │─JSON▶│ payload: PR, branch, pass,  │───▶│ checkout PR branch      │
 │ sort by last activity asc  │      │ comment ids                 │    │ fix in scope, commit    │
 │ truncate to MAX_PRS        │      │ hold slot to stagger        │    │ with trailer, push,     │
 └────────────────────────────┘      └─────────────────────────────┘    │ reply to EVERY comment  │
                                                                        └─────────────────────────┘
```

The heavy lifting happens in a **cloud session** created by firing the
"Gladys scheduled PR autofix" routine (see Setup): the GitHub runner only
makes one HTTP call per PR. Each session is visible at claude.ai/code, acts
under the routine owner's GitHub identity (commits, pushes and replies appear
as that user), and its pushes trigger the PR CI like any human push.

A PR is eligible when **all** of this is true:

1. open, not a draft, no merge conflict (`mergeable_state` ≠ `dirty`), its
   head branch belongs to this repository (fork PRs are skipped) and starts
   with `HEAD_BRANCH_PREFIX` (cloud sessions may only push `claude/`
   branches);
2. it carries fewer than `MAX_PASSES` autofix commits, counted via the
   `Autofix-Pass: <n>` commit-message trailer (commit authors are ambiguous,
   the trailer is not);
3. it has neither the `claude:autofix-exhausted` nor the `claude:autofix-skip`
   label;
4. it has at least one review comment or issue comment that is, all at once:
   - authored by a review bot (`REVIEW_BOT_LOGINS`),
   - not in a resolved review thread,
   - not yet replied to by the autofix (see "How a comment is marked handled"),
   - created **after** the last autofix commit (or the PR creation when no
     pass ran yet) and **before** now minus `QUIET_PERIOD_HOURS`.

The date window and the mandatory replies are the anti-loop core: feedback the
bots post after an autofix push can trigger at most one more pass, and a pass
never re-processes what a previous one already answered. `MAX_PASSES` bounds
the total no matter what.

## How a comment is marked handled

Every fired session must reply to **every** comment it was given — including
the ones it declines — and each reply embeds a hidden marker:

```
<!-- Autofix-Handled: rc-<id> -->   (review comment)
<!-- Autofix-Handled: ic-<id> -->   (issue comment)
```

The select job greps these markers in the comments posted by
`AUTOFIX_ACTOR_LOGINS`; a marked comment is never selected again. An in-thread
reply by one of those actors (including a manual reply by the routine owner)
also marks the whole thread, and resolving a thread by hand excludes it too.

## Constants (top of the workflow file)

| Constant | Value | Role |
| --- | --- | --- |
| `MAX_PASSES` | 3 | Hard cap of autofix commits per PR. Reached with feedback still pending → exhausted. |
| `MAX_PRS` | 8 | Budget circuit breaker: max PRs per daily run, oldest activity first. Each fire also draws down the account's daily routine-run allowance. |
| `QUIET_PERIOD_HOURS` | 2 | A comment younger than this is left for the next run, so a review round can finish (and a human can veto). |
| `REVIEW_BOT_LOGINS` | `cursor[bot]`, `coderabbitai[bot]` | Whose comments count as actionable feedback. |
| `AUTOFIX_ACTOR_LOGINS` | `Pierre-Gilles`, `github-actions[bot]`, `claude[bot]` | Whose replies/markers count as "handled". Cloud sessions post as the routine owner (first login). |
| `HEAD_BRANCH_PREFIX` | `claude/` | Cloud sessions can only push branches with this prefix; other PRs are skipped. |
| `FIRE_STAGGER_MINUTES` | 8 | How long each matrix slot is held after firing. With `max-parallel: 2`, keeps ~2 sessions running at a time (no public API exposes session completion). |
| `EXHAUSTED_LABEL` | `claude:autofix-exhausted` | Permanently stops the autofix on a PR. Posed automatically. |
| `SKIP_LABEL` | `claude:autofix-skip` | Manual opt-out for a PR. |
| `NOISE_MARKER` | `This is an auto-generated comment` | Filters CodeRabbit's non-actionable issue comments (walkthroughs, status notes). |

Both labels are created automatically if missing.

## Setup (one time)

The routine **"Gladys scheduled PR autofix"** (`trig_01MLrtedaqqTpR1gwdsSqSPQ`)
already exists on the maintainer's claude.ai account, with the full autofix
prompt saved; each fire creates a fresh cloud session in the Gladys
environment. What remains is web-UI-only:

1. Open [claude.ai/code/routines](https://claude.ai/code/routines), edit
   **Gladys scheduled PR autofix**, and under **Select a trigger** add an
   **API** trigger.
2. Copy the trigger URL
   (`https://api.anthropic.com/v1/claude_code/routines/trig_.../fire`) into
   the repository **variable** `CLAUDE_AUTOFIX_FIRE_URL`.
3. Click **Generate token** and store the `sk-ant-oat01-...` value (shown
   once) as the repository **secret** `CLAUDE_AUTOFIX_ROUTINE_TOKEN`.

No Anthropic API key and no PAT are needed: sessions bill the claude.ai
subscription, and their GitHub access comes from the account's GitHub
connection. If the routine's prompt needs changing (it mirrors the contract
described here: payload fields, strict scope, trailer, mandatory replies with
markers), edit it on the routine's page.

## When a PR becomes "exhausted"

When a PR still has unhandled bot feedback after `MAX_PASSES` passes, the
select job adds `claude:autofix-exhausted` and posts a short comment. From
there:

1. Review the remaining bot comments yourself: fix, reply, or resolve the
   threads.
2. **Leave the label in place.** The pass count lives in the branch history
   (the trailers), so removing the label while unhandled comments remain only
   makes the next run re-label and re-comment. The label is the terminal
   state for automation on that PR; finishing it is a human job.

## Dry run

`Actions → Scheduled Claude autofix → Run workflow` with `dry_run` checked
runs the selection only and logs, for each PR: eligibility or the skip reason,
the passes already burnt, and every retained comment (id, author, date,
excerpt). Nothing is written and no cloud session is fired.

## Known limits

- **Fire and forget**: the `/fire` API returns the session URL (logged in the
  job summary) but there is no public endpoint to poll for completion, so the
  workflow cannot fail when a session fails — check claude.ai/code or the
  next day's selection (an untouched PR simply comes back).
- The `/fire` endpoint is in research preview behind the
  `experimental-cc-routine-2026-04-01` beta header; Anthropic may change it.
- Routine runs count against the account's **daily routine-run cap** and
  subscription usage; HTTP 429 on the fire call means the cap was hit.
- A comment posted less than `QUIET_PERIOD_HOURS` before the daily run waits
  for the next day: worst-case latency is ~26 h.
- `mergeable_state` is computed asynchronously by GitHub; a PR in `unknown`
  state is treated as conflict-free.
- Cursor/CodeRabbit re-review every push, including autofix pushes: each pass
  can generate fresh feedback, which is why `MAX_PASSES` exists.
