import { Text } from 'preact-i18n';
import cx from 'classnames';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { JOB_STATUS } from '../../../../../server/utils/constants';

dayjs.extend(relativeTime);

const JobList = ({ children, ...props }) => (
  <div class="card">
    <h3 class="card-header">
      <Text id="jobsSettings.jobsTitle" />
    </h3>
    <div class="table-responsive">
      <table class="table table-hover table-outline table-vcenter text-nowrap card-table">
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
                      {dayjs(job.created_at)
                        .locale(props.user.language)
                        .fromNow()}
                    </small>
                  </div>
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
    </div>
  </div>
);

export default JobList;
