import { Text } from 'preact-i18n';
import cx from 'classnames';
import { JOB_STATUS, JOB_ERROR_TYPES } from '../../../../../server/utils/constants';
import RelativeTime from '../../../components/device/RelativeTime';
import style from './style.css';

// Format a duration with an adaptive unit: "247 ms", "12 s", "3 min 05 s", "2 h 04 min"
const formatJobDuration = durationMs => {
  if (!Number.isFinite(durationMs) || durationMs < 0) {
    return null;
  }
  if (durationMs < 1000) {
    return `${Math.round(durationMs)} ms`;
  }
  const totalSeconds = Math.round(durationMs / 1000);
  if (totalSeconds < 60) {
    return `${totalSeconds} s`;
  }
  const totalMinutes = Math.floor(totalSeconds / 60);
  const restSeconds = totalSeconds % 60;
  if (totalMinutes < 60) {
    return `${totalMinutes} min ${String(restSeconds).padStart(2, '0')} s`;
  }
  const hours = Math.floor(totalMinutes / 60);
  const restMinutes = totalMinutes % 60;
  return `${hours} h ${String(restMinutes).padStart(2, '0')} min`;
};

const JobList = ({ children, ...props }) => (
  <div class="card">
    <div class="card-header">
      <i class="fe fe-cpu mr-3" />
      <h3 class="card-title">
        <Text id="jobsSettings.jobsTitle" />
      </h3>
    </div>
    <div class="card-body">
      <Text id="jobsSettings.jobsDescription" />
    </div>
    <div class="table-responsive">
      <table class="table table-hover table-outline table-vcenter card-table">
        <thead>
          <tr>
            <th>
              <Text id="jobsSettings.jobType" />
            </th>
            <th>
              <Text id="jobsSettings.jobStatus" />
            </th>
          </tr>
        </thead>
        <tbody>
          {props.jobs &&
            props.jobs.map(job => (
              <tr>
                <td>
                  <div>
                    <Text id={`jobsSettings.jobTypes.${job.type}`} />
                  </div>
                  <div>
                    <small>
                      <RelativeTime datetime={job.created_at} language={props.user.language} futureDisabled />
                    </small>
                  </div>
                  {job.data && job.data.device_name && job.data.device_feature_name && (
                    <div class="text-muted small">
                      <Text
                        id="jobsSettings.jobData.target"
                        fields={{ device: job.data.device_name, feature: job.data.device_feature_name }}
                      />
                    </div>
                  )}
                  {job.data &&
                    (job.data.duckdb_states_count !== undefined || job.data.sqlite_states_count !== undefined) && (
                      <div class="text-muted small">
                        <Text
                          id="jobsSettings.jobData.statesCounts"
                          fields={{
                            duckdb: (job.data.duckdb_states_count || 0).toLocaleString(props.user.language),
                            sqlite: (job.data.sqlite_states_count || 0).toLocaleString(props.user.language),
                            aggregates: (job.data.aggregates_count || 0).toLocaleString(props.user.language)
                          }}
                        />
                      </div>
                    )}
                  {job.data && job.data.orphaned_states_count !== undefined && (
                    <div class="text-muted small">
                      <Text
                        id="jobsSettings.jobData.orphanedStates"
                        fields={{ count: job.data.orphaned_states_count.toLocaleString(props.user.language) }}
                      />
                    </div>
                  )}
                  {job.status !== JOB_STATUS.IN_PROGRESS &&
                    formatJobDuration(new Date(job.updated_at) - new Date(job.created_at)) && (
                      <div class="text-muted small">
                        <Text
                          id="jobsSettings.jobData.duration"
                          fields={{
                            duration: formatJobDuration(new Date(job.updated_at) - new Date(job.created_at))
                          }}
                        />
                      </div>
                    )}
                  {job.data && job.data.error_type && job.data.error_type !== JOB_ERROR_TYPES.UNKNOWN_ERROR && (
                    <div class={style.errorDiv}>
                      <pre class={style.errorDirectDiv}>
                        <Text id={`jobsSettings.jobErrors.${job.data.error_type}`} />
                      </pre>
                    </div>
                  )}
                  {job.data && job.data.error_type === JOB_ERROR_TYPES.UNKNOWN_ERROR && (
                    <div class={style.errorDiv}>
                      <pre class={style.errorDirectDiv}>{job.data.error}</pre>
                    </div>
                  )}
                </td>
                <td>
                  <span
                    class={cx('badge', {
                      'badge-success': job.status === JOB_STATUS.SUCCESS,
                      'badge-primary': job.status === JOB_STATUS.IN_PROGRESS,
                      'badge-danger': job.status === JOB_STATUS.FAILED
                    })}
                  >
                    {job.status !== JOB_STATUS.IN_PROGRESS && <Text id={`jobsSettings.jobStatuses.${job.status}`} />}
                    {job.status === JOB_STATUS.IN_PROGRESS && (
                      <span>
                        {job.progress} <Text id="global.percent" />
                      </span>
                    )}
                  </span>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
      <div class="card-body">
        {!props.isFirstPage && (
          <button class="btn btn-secondary" onClick={props.loadPreviousPage}>
            <Text id="jobsSettings.previous" />
          </button>
        )}
        {!props.isLastPage && (
          <button class="btn btn-secondary" onClick={props.loadNextPage}>
            <Text id="jobsSettings.next" />
          </button>
        )}
      </div>
    </div>
  </div>
);

export default JobList;
