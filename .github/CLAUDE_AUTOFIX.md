# Claude autofix

Two workflows launch Claude Code **cloud sessions** (claude.ai/code) on the
open pull requests of this repository. They fire the same claude.ai routine
and differ only in what starts them and what they are given to do:

| Workflow | Starts on | Work order |
| --- | --- | --- |
| [`claude-scheduled-autofix.yml`](#scheduled-review-bot-feedback) | a cron, every 3 h | the unhandled **review-bot** comments (Cursor, CodeRabbit) of the PR |
| [`claude-on-demand-autofix.yml`](#on-demand-the-claude-command) | a **`/claude …` comment** | the comment itself, whatever it asks |

Use the cron for bot feedback you do not want to babysit, and the command when
you have something specific to say to Claude on a PR. If you find yourself
waiting on the cron to pick up something you already spotted, write
`/claude …` instead.

## Scheduled: review-bot feedback

`claude-scheduled-autofix.yml` runs every 3 hours (04:30–19:30 UTC, 6
runs a day; an empty run is free since nothing is fired) and launches sessions
to address the review-bot feedback (Cursor, CodeRabbit) left on open pull
requests — with hard caps, and without the runaway loop of the event-driven
mode (Claude pushes → the bots re-review → Claude reacts again, forever).

### How it works

```text
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
2. its highest `Autofix-Pass: <n>` commit-message trailer is below
   `MAX_PASSES` (commit authors are ambiguous, the trailer is not; the
   highest value rather than the commit count, so an amended or rebased
   pass cannot burn the budget twice);
3. it has neither the `claude:autofix-exhausted` nor the `claude:autofix-skip`
   label;
4. it has at least one review comment or issue comment that is, all at once:
   - authored by a review bot (`REVIEW_BOT_LOGINS`),
   - not in a resolved review thread,
   - not yet replied to by the autofix (see "How a comment is marked handled"),
   - older than now minus `QUIET_PERIOD_HOURS`.

The mandatory marker replies are the anti-loop core: a pass never re-processes
what a previous one already answered, and feedback the bots post after an
autofix push can trigger at most one more pass. There is deliberately **no
lower date bound** on comments: markers, not dates, are the source of truth
for "handled", so a session that pushed but died before posting its replies
leaves its comments eligible — they are retried at the next run (burning
another pass) instead of silently falling out of a date window. A stuck PR
therefore always ends up either fixed or visibly `exhausted`; feedback is
never orphaned. `MAX_PASSES` bounds the total no matter what. (A fire that
fails before a session starts — daily routine cap, bad token — burns no pass
and simply retries at the next run, at the cost of one HTTP call and a red
job.)

### How a comment is marked handled

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

### Constants (top of the workflow file)

| Constant | Value | Role |
| --- | --- | --- |
| `MAX_PASSES` | 3 | Hard cap of autofix passes per PR (highest trailer value). Reached with feedback still pending → exhausted. |
| `MAX_PRS` | 10 | Budget circuit breaker: max PRs per run, oldest activity first. Each fire also draws down the account's daily routine-run allowance. |
| `QUIET_PERIOD_HOURS` | 2 | A comment younger than this is left for the next run, so a review round can finish (and a human can veto). |
| `REVIEW_BOT_LOGINS` | `cursor[bot]`, `coderabbitai[bot]` | Whose comments count as actionable feedback. |
| `AUTOFIX_ACTOR_LOGINS` | `Pierre-Gilles`, `github-actions[bot]`, `claude[bot]` | Whose replies/markers count as "handled". Cloud sessions post as the routine owner (first login). |
| `HEAD_BRANCH_PREFIX` | `claude/` | Cloud sessions can only push branches with this prefix; other PRs are skipped. |
| `FIRE_STAGGER_MINUTES` | 5 | How long each matrix slot is held after firing. With `max-parallel: 3`, staggers session *launches* (~3 fires per window); it does not bound how many sessions run concurrently. |
| `EXHAUSTED_LABEL` | `claude:autofix-exhausted` | Permanently stops the autofix on a PR. Posted automatically. |
| `SKIP_LABEL` | `claude:autofix-skip` | Manual opt-out for a PR. |
| `NOISE_MARKER` | `This is an auto-generated comment` | Filters CodeRabbit's non-actionable issue comments (walkthroughs, status notes). |

Both labels are created automatically if missing.

### When a PR becomes "exhausted"

When a PR still has unhandled bot feedback after `MAX_PASSES` passes, the
select job adds `claude:autofix-exhausted` and posts a short comment. From
there:

1. Review the remaining bot comments yourself: fix, reply, or resolve the
   threads.
2. **Leave the label in place.** The pass count lives in the branch history
   (the trailers), so removing the label while unhandled comments remain only
   makes the next run re-label and re-comment. The label is the terminal
   state for automation on that PR; finishing it is a human job.

### Dry run

`Actions → Scheduled Claude autofix → Run workflow` with `dry_run` checked
runs the selection only and logs, for each PR: eligibility or the skip reason,
the passes already burnt, and every retained comment (id, author, date,
excerpt). Nothing is written and no cloud session is fired.

## On demand: the `/claude` command

`claude-on-demand-autofix.yml` is how you hand Claude a piece of feedback
yourself, instead of waiting for the cron to notice something it would most
likely never select anyway. Write a comment whose **line starts with
`/claude`**, followed by what you want done:

```text
/claude fix the merge conflicts with master
/claude the readInitialDeviceStates test fails on CI, have a look
/claude the alarm badges render green even when the fault is active
/claude why did you make the door feature read-only here?
```

It works from all three places you normally review from: the PR conversation,
a comment on a line of the diff (the file and line become part of the
request), and the summary body of a submitted review. The whole comment is
forwarded, so a multi-line message with details is fine — anything past 4000
characters is cut.

The command must open its own line, so quoting somebody else (`> /claude …`)
never fires a session, and a bare `/claude` with no instruction is refused.

**Who may run it:** `OWNER`, `MEMBER` and `COLLABORATOR` only. This is
deliberately stricter than `/cursor review`, which the PR author may also
run: a session pushes commits and spends the maintainer's claude.ai
allowance, so an outside contributor must not be able to start one on their
own PR. A refused command gets a 👎 reaction.

**What it will work on**, beyond the cron's rules:

- a PR **in merge conflict** — fixing one is a normal request, and the cron
  skips those entirely;
- a **draft** PR;
- a PR labelled `claude:autofix-exhausted` or `claude:autofix-skip` — those
  labels stop the cron, and an explicit human request outranks them.

The constraints it cannot lift are the ones the cloud session itself has: the
PR must be **open**, its head branch must belong to this repository (**no fork
PRs**) and be `claude/`-prefixed, because sessions can only push such
branches. When one of those blocks the request, the workflow says so in the
thread rather than failing silently — an explicit command that does nothing
visible is the failure mode this whole workflow exists to remove.

The session acknowledges with 👀 when the command is accepted and 🚀 once it
is started, then always answers in the thread — including when it declined
part of the request or could not make it work. There is no retry: nothing
re-fires a dropped request, which is why the reply is mandatory in the prompt.

Commits made this way carry an `Autofix-Request: <comment id>` trailer, never
`Autofix-Pass: <n>`, so asking Claude something by hand **never eats into the
cron's `MAX_PASSES` budget** for that PR.

## Setup (one time)

Both workflows fire the **same** routine with the **same** variable and
secret, so this setup is done once for the two of them; the payload's `mode`
field is what tells the routine which procedure to run.

The routine **"Gladys scheduled PR autofix"** (`trig_01MLrtedaqqTpR1gwdsSqSPQ`)
already exists on the maintainer's claude.ai account, with the full autofix
prompt saved; each fire creates a fresh cloud session in the Gladys
environment. What remains is web-UI-only:

1. Open [claude.ai/code/routines](https://claude.ai/code/routines), edit
   **Gladys scheduled PR autofix**, and under **Select a trigger** add an
   **API** trigger.
2. Copy the trigger URL
   (`https://api.anthropic.com/v1/claude_code/routines/trig_.../fire`) into
   the repository **variable** `CLAUDE_AUTOFIX_FIRE_URL` (Settings →
   Secrets and variables → Actions → **Variables** tab; a secret of the
   same name works too, the workflow accepts either).
3. Click **Generate token** and store the `sk-ant-oat01-...` value (shown
   once) as the repository **secret** `CLAUDE_AUTOFIX_ROUTINE_TOKEN`
   (**Secrets** tab).

No Anthropic API key and no PAT are needed: sessions bill the claude.ai
subscription, and their GitHub access comes from the account's GitHub
connection (keep that connection's OAuth scopes to the minimum the routine
needs: push and comment on this repository).

The routine's full prompt is versioned in
[`CLAUDE_AUTOFIX_ROUTINE_PROMPT.md`](CLAUDE_AUTOFIX_ROUTINE_PROMPT.md) — it
holds both procedures and is the security boundary of the fired sessions
(strict scope, mandatory markers, payload treated as data except the on-demand
`instruction` field), so treat any edit to it like a workflow change: review it
in a pull request first, then copy it to the routine's page, and keep the two
in sync. **A new `mode` cannot work until the prompt on the routine's page has
been updated** — the workflows only send the payload, the prompt is what knows
what to do with it.

## Decommissioning the event-driven mode (merge prerequisite)

The old event-driven mode — Claude reacting on its own to every PR event —
lives in the Claude GitHub App / claude.ai automation configuration, outside
git. It must stay disabled: otherwise it runs alongside these workflows and
the push → re-review → react loop the cron exists to kill continues.

`claude-on-demand-autofix.yml` is not a return to that mode: it never reacts
to a PR event, only to an explicit `/claude` command from a maintainer, which
is also why it needs no pass budget of its own. Note that it deliberately
does **not** listen for `@claude`, so re-enabling the GitHub App mode could
not double-fire on the same comment.

`cursor-automation-webhook.yml` and `pr-classify.yml` trigger reviews and
labels, not Claude, and stay in place.

## Known limits

- **Fire and forget**: the `/fire` API returns the session URL (logged in the
  job summary) but there is no public endpoint to poll for completion, so the
  workflow cannot fail when a session fails — check claude.ai/code or the
  next run's selection (an untouched PR simply comes back).
- The `/fire` endpoint is in research preview behind the
  `experimental-cc-routine-2026-04-01` beta header; Anthropic may change it.
- Routine runs count against the account's **daily routine-run cap** and
  subscription usage; HTTP 429 on the fire call means the cap was hit.
- The fire is not idempotent: manually re-running the workflow while a
  previous run's sessions are still working can fire a second session for
  the same PR and pass. Consequences are bounded (the pass counter takes the
  highest trailer, and markers prevent re-selection on *later* runs — they
  are not concurrency control, so two live sessions can post duplicate
  replies and overlapping commits). Avoid manual dispatches right after a
  scheduled run — and keep the schedule spacing well above a session's
  lifetime (3 h is fine, hourly would not be) for the same reason.
- A comment posted less than `QUIET_PERIOD_HOURS` before a run waits for the
  next one: worst-case latency is ~5 h (2 h quiet period + 3 h to the next
  run, ~11 h across the overnight gap).
- Review threads with more than 100 replies are read truncated when looking
  for autofix replies (unreachable in practice on this repo's PRs).
- `mergeable_state` is computed asynchronously by GitHub; a PR in `unknown`
  state is treated as conflict-free.
- Cursor/CodeRabbit re-review every push, including autofix pushes: each pass
  can generate fresh feedback, which is why `MAX_PASSES` exists.

On demand (`/claude`):

- **No budget cap.** The pass counter is the cron's, and on-demand commits
  deliberately stay out of it, so nothing limits how many sessions a
  maintainer can start beyond the account's daily routine-run cap. That is the
  intent — a human asking is the throttle — but three commands in a row are
  three sessions.
- **Not a mutex.** The per-PR concurrency group serialises the *fires*, not the
  sessions, which outlive their job with no API to poll. Posting a second
  command while the first session is still working can put two sessions on the
  same branch; wait for its reply before asking for the next thing.
- Only the triggering comment is forwarded. A session reads the PR, its diff
  and its CI on its own, but a request that refers to "the comment above"
  needs that context restated in the `/claude` comment itself.
- The command works only on `claude/`-prefixed branches of this repository,
  so it cannot help on a fork PR or on a human's own branch — same push
  constraint as the cron.
