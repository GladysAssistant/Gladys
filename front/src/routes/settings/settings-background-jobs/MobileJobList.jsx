import { Component } from 'preact';
import { Text } from 'preact-i18n';
import cx from 'classnames';

import { JOB_STATUS, JOB_ERROR_TYPES } from '../../../../../server/utils/constants';
import RelativeTime from '../../../components/device/RelativeTime';
import { MobileGroup, MobilePill, MobileEmptyState, BigButton, kitStyle } from '../../../components/mobile';
import JobData from './JobData';
import { JobDuration } from './JobList';
import style from '../mobileSettings.css';

const STATUS_TONES = {
  [JOB_STATUS.SUCCESS]: 'success',
  [JOB_STATUS.IN_PROGRESS]: 'accent',
  [JOB_STATUS.FAILED]: 'danger'
};

const STATUS_ICONS = {
  [JOB_STATUS.SUCCESS]: 'check',
  [JOB_STATUS.IN_PROGRESS]: 'loader',
  [JOB_STATUS.FAILED]: 'alert-triangle'
};

// an error longer than this is folded on four lines, with a button to read it all
const FOLD_ERROR_FROM_LENGTH = 220;

// The error of a failed job: wrapped in the row (the desktop table gives it a fixed width), and
// folded when it is a stack trace
class JobError extends Component {
  state = {
    expanded: false
  };

  toggle = () => this.setState(prevState => ({ expanded: !prevState.expanded }));

  render({ job }, { expanded }) {
    if (!job.data || !job.data.error_type) {
      return null;
    }
    const unknownError = job.data.error_type === JOB_ERROR_TYPES.UNKNOWN_ERROR;
    const foldable = unknownError && String(job.data.error || '').length > FOLD_ERROR_FROM_LENGTH;
    return (
      <div class={style.rowDetails}>
        <div
          class={cx(style.errorBlock, {
            [style.errorBlockRaw]: unknownError,
            [style.errorBlockFolded]: foldable && !expanded
          })}
          data-cy="job-error"
        >
          {unknownError ? job.data.error : <Text id={`jobsSettings.jobErrors.${job.data.error_type}`} />}
        </div>
        {foldable && (
          <button
            type="button"
            class={style.moreButton}
            onClick={this.toggle}
            aria-expanded={expanded ? 'true' : 'false'}
            data-cy="job-error-toggle"
          >
            <Text id={expanded ? 'jobsSettings.mobile.showLess' : 'jobsSettings.mobile.showMore'} />
          </button>
        )}
      </div>
    );
  }
}

/**
 * @description The background jobs on a phone (docs/specs/mobile-pages/settings-pages.md, D): one
 * row per job — its type, when it ran and for how long, what it did (the same `JobData`
 * renderers as the table), its error readable where it is — with its status as a pill, or its
 * progress while it runs.
 */
const MobileJobList = ({ jobs, user, loadNextPage, loadPreviousPage, isFirstPage, isLastPage }) => (
  <div class={style.page} data-cy="jobs-mobile">
    <p class={style.lead}>
      <Text id="jobsSettings.mobile.description" />
    </p>
    {jobs && jobs.length > 0 && (
      <MobileGroup>
        {jobs.map(job => {
          const inProgress = job.status === JOB_STATUS.IN_PROGRESS;
          const progress = Math.max(0, Math.min(100, Number(job.progress) || 0));
          return (
            <div key={job.id} class={cx(kitStyle.row, style.jobRow)} data-cy="job-row">
              <span
                class={cx(kitStyle.rowTile, {
                  [kitStyle[`rowTile-${STATUS_TONES[job.status]}`]]: STATUS_TONES[job.status] !== 'accent'
                })}
                aria-hidden="true"
              >
                <i class={`fe fe-${STATUS_ICONS[job.status] || 'cpu'}`} />
              </span>
              <span class={kitStyle.rowText}>
                <span class={kitStyle.rowTitle}>
                  <Text id={`jobsSettings.jobTypes.${job.type}`}>{job.type}</Text>
                </span>
                <span class={kitStyle.rowSub}>
                  <RelativeTime datetime={job.created_at} language={user.language} futureDisabled />
                </span>
              </span>
              <span class={style.jobPill}>
                <MobilePill tone={STATUS_TONES[job.status]} data-cy="job-status">
                  {inProgress ? (
                    <span>
                      {progress} <Text id="global.percent" />
                    </span>
                  ) : (
                    <Text id={`jobsSettings.jobStatuses.${job.status}`}>{job.status}</Text>
                  )}
                </MobilePill>
              </span>
              <div class={style.jobBody}>
                <div class={style.rowDetails}>
                  <JobData job={job} user={user} />
                  <JobDuration start={job.created_at} end={job.updated_at} inProgress={inProgress} />
                </div>
                {inProgress && (
                  <div
                    class={style.progress}
                    role="progressbar"
                    aria-valuemin="0"
                    aria-valuemax="100"
                    aria-valuenow={progress}
                  >
                    <div class={style.progressBar} style={{ width: `${progress}%` }} />
                  </div>
                )}
                <JobError job={job} />
              </div>
            </div>
          );
        })}
      </MobileGroup>
    )}
    {jobs && jobs.length === 0 && <MobileEmptyState icon="cpu" text={<Text id="jobsSettings.mobile.empty" />} />}
    {(!isFirstPage || !isLastPage) && (
      <div class={style.pagination}>
        <BigButton icon="chevron-left" onClick={loadPreviousPage} disabled={isFirstPage} data-cy="jobs-previous">
          <Text id="jobsSettings.previous" />
        </BigButton>
        <BigButton onClick={loadNextPage} disabled={isLastPage} data-cy="jobs-next">
          <Text id="jobsSettings.next" />
          <i class="fe fe-chevron-right" aria-hidden="true" />
        </BigButton>
      </div>
    )}
  </div>
);

export default MobileJobList;
