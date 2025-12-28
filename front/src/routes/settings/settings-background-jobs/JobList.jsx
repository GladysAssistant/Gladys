import { Text } from 'preact-i18n';
import cx from 'classnames';
import { JOB_STATUS, JOB_ERROR_TYPES } from '../../../../../server/utils/constants';
import RelativeTime from '../../../components/device/RelativeTime';
import style from './style.css';

const formatPeriodDate = (value, language) => {
  if (!value) {
    return value;
  }
  const date = new Date(value);
  const hasTime =
    date.getUTCHours() !== 0 ||
    date.getUTCMinutes() !== 0 ||
    date.getUTCSeconds() !== 0 ||
    date.getUTCMilliseconds() !== 0;
  if (hasTime) {
    return date.toLocaleString(language || undefined);
  }
  return date.toLocaleDateString(language || undefined);
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
                  {job.data && job.data.period && (
                    <div class="mt-1 text-muted small">
                      {job.data.period.start_date && job.data.period.end_date && (
                        <Text
                          id="jobsSettings.periodFromTo"
                          defaultMessage="Period: from {{startDate}} to {{endDate}}."
                          fields={{
                            startDate: formatPeriodDate(job.data.period.start_date, props.user.language),
                            endDate: formatPeriodDate(job.data.period.end_date, props.user.language)
                          }}
                        />
                      )}
                      {job.data.period.start_date && !job.data.period.end_date && (
                        <Text
                          id="jobsSettings.periodFrom"
                          defaultMessage="Period: from {{startDate}}."
                          fields={{ startDate: formatPeriodDate(job.data.period.start_date, props.user.language) }}
                        />
                      )}
                      {!job.data.period.start_date && job.data.period.end_date && (
                        <Text
                          id="jobsSettings.periodUntil"
                          defaultMessage="Period: until {{endDate}}."
                          fields={{ endDate: formatPeriodDate(job.data.period.end_date, props.user.language) }}
                        />
                      )}
                    </div>
                  )}
                  {job.data &&
                    job.data.scope === 'selection' &&
                    Array.isArray(job.data.devices) &&
                    job.data.devices.length > 0 && (
                      <div class="mt-1 text-muted">
                        <div>
                          <Text id="jobsSettings.selectionTitle" />:
                        </div>
                        {job.data.devices.map(device => (
                          <div class="small" key={`${device.device}-${(device.features || []).join('|')}`}>
                            <strong>{device.device}</strong>
                            {device.features && device.features.length > 0 && (
                              <div>
                                <Text id="jobsSettings.selectionFeatures" />: {device.features.join(', ')}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  {job.data && job.data.current_date && job.status !== JOB_STATUS.SUCCESS && (
                    <div class="mt-1 small">
                      <Text
                        id="jobsSettings.currentDate"
                        defaultMessage="Progress date: {{date}}."
                        fields={{ date: job.data.current_date }}
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
