# Scheduled Claude autofix

`claude-scheduled-autofix.yml` runs once a day and lets Claude Code address the
review-bot feedback (Cursor, CodeRabbit) left on open pull requests — with hard
caps, and without the runaway loop of the event-driven mode (Claude pushes →
the bots re-review → Claude reacts again, forever).

## How it works

```
 select (bash + gh api, no LLM)          fix (matrix, one job per PR, max 2 in parallel)
 ┌────────────────────────────┐          ┌──────────────────────────────────────────┐
 │ list open PRs              │          │ checkout the PR branch                   │
 │ apply eligibility rules    │──JSON──▶ │ invoke Claude Code ONCE                  │
 │ sort by last activity asc  │          │ fix in scope, commit with trailer, push  │
 │ truncate to MAX_PRS        │          │ reply to EVERY listed comment            │
 └────────────────────────────┘          └──────────────────────────────────────────┘
```

A PR is eligible when **all** of this is true:

1. open, not a draft, no merge conflict (`mergeable_state` ≠ `dirty`), and its
   head branch belongs to this repository (fork PRs are skipped: the fix job
   pushes to the branch and runs with secrets);
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

Every fix job must reply to **every** comment it was given — including the ones
it declines — and each reply embeds a hidden marker:

```
<!-- Autofix-Handled: rc-<id> -->   (review comment)
<!-- Autofix-Handled: ic-<id> -->   (issue comment)
```

The select job greps these markers in the comments posted by
`AUTOFIX_ACTOR_LOGINS`; a marked comment is never selected again. An in-thread
reply by an autofix actor also marks the whole thread, and resolving a thread
by hand excludes it too.

## Constants (top of the workflow file)

| Constant | Value | Role |
| --- | --- | --- |
| `MAX_PASSES` | 3 | Hard cap of autofix commits per PR. Reached with feedback still pending → exhausted. |
| `MAX_PRS` | 8 | Budget circuit breaker: max PRs per daily run, oldest activity first. |
| `QUIET_PERIOD_HOURS` | 2 | A comment younger than this is left for the next run, so a review round can finish (and a human can veto). |
| `REVIEW_BOT_LOGINS` | `cursor[bot]`, `coderabbitai[bot]` | Whose comments count as actionable feedback. |
| `AUTOFIX_ACTOR_LOGINS` | `github-actions[bot]`, `claude[bot]` | Whose replies/markers count as "handled". Replies are posted with the workflow token, i.e. `github-actions[bot]`. |
| `EXHAUSTED_LABEL` | `claude:autofix-exhausted` | Permanently stops the autofix on a PR. Posed automatically. |
| `SKIP_LABEL` | `claude:autofix-skip` | Manual opt-out for a PR. |
| `NOISE_MARKER` | `This is an auto-generated comment` | Filters CodeRabbit's non-actionable issue comments (walkthroughs, status notes). |

Both labels are created automatically if missing.

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
excerpt). Nothing is written and Claude is not invoked.

## Secrets

| Secret | Required | Role |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | yes | Claude API key for the fix job (swap for `claude_code_oauth_token` in the workflow if you use an OAuth token). |
| `AUTOFIX_PUSH_TOKEN` | recommended | PAT with `contents: write`. Autofix pushes made with it retrigger the PR CI (`docker-pr-build`); pushes made with the default `GITHUB_TOKEN` never retrigger workflows, so CI would stay stale on autofix commits. |

## Known limits

- A comment posted less than `QUIET_PERIOD_HOURS` before the daily run waits
  for the next day: worst-case latency is ~26 h. That is the accepted price of
  a batch cadence.
- `mergeable_state` is computed asynchronously by GitHub; a PR in `unknown`
  state is treated as conflict-free.
- Cursor/CodeRabbit re-review every push, including autofix pushes: each pass
  can generate fresh feedback, which is why `MAX_PASSES` exists.
