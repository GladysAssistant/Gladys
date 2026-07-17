import { Fragment } from 'preact';
import { Text } from 'preact-i18n';
import { JOB_STATUS, JOB_TYPES } from '../../../../../server/utils/constants';

// Current step of a running job (hidden once the job is finished)
const JobStep = ({ job }) =>
  job.status === JOB_STATUS.IN_PROGRESS &&
  job.data.step && (
    <div class="text-muted small">
      <Text id={`jobsSettings.jobData.steps.${job.data.step}`} />
    </div>
  );

// "N DuckDB + N SQLite — N aggregates", switching to the past tense on success
const JobStatesCounts = ({ job, user }) =>
  (job.data.duckdb_states_count !== undefined || job.data.sqlite_states_count !== undefined) && (
    <div class="text-muted small">
      <Text
        id={
          job.status === JOB_STATUS.SUCCESS
            ? 'jobsSettings.jobData.statesCountsDone'
            : 'jobsSettings.jobData.statesCounts'
        }
        fields={{
          duckdb: (job.data.duckdb_states_count || 0).toLocaleString(user.language),
          sqlite: (job.data.sqlite_states_count || 0).toLocaleString(user.language),
          aggregates: (job.data.aggregates_count || 0).toLocaleString(user.language)
        }}
      />
    </div>
  );

const PurgeSingleFeatureJobData = ({ job, user }) => (
  <Fragment>
    {job.data.device_name && job.data.device_feature_name && (
      <div class="text-muted small">
        <Text
          id="jobsSettings.jobData.target"
          fields={{ device: job.data.device_name, feature: job.data.device_feature_name }}
        />
      </div>
    )}
    <JobStep job={job} />
    <JobStatesCounts job={job} user={user} />
  </Fragment>
);

const PurgeAllSqliteJobData = ({ job, user }) => (
  <Fragment>
    <JobStep job={job} />
    <JobStatesCounts job={job} user={user} />
  </Fragment>
);

const PurgeOrphanedJobData = ({ job, user }) => (
  <Fragment>
    <JobStep job={job} />
    {job.data.orphaned_states_count !== undefined && (
      <div class="text-muted small">
        <Text
          id="jobsSettings.jobData.orphanedStates"
          fields={{ count: job.data.orphaned_states_count.toLocaleString(user.language) }}
        />
      </div>
    )}
  </Fragment>
);

// One renderer per job type: a new job type plugs its own renderer here instead of
// adding type-specific conditions to the generic job list.
const JOB_DATA_RENDERERS = {
  [JOB_TYPES.DEVICE_STATES_PURGE_SINGLE_FEATURE]: PurgeSingleFeatureJobData,
  [JOB_TYPES.DEVICE_STATES_PURGE_ALL_SQLITE_STATES]: PurgeAllSqliteJobData,
  [JOB_TYPES.DEVICE_STATES_PURGE_ORPHANED_DUCKDB_STATES]: PurgeOrphanedJobData
};

// Structured facts attached by the job (job.data), rendered by the job type's own renderer
const JobData = ({ job, user }) => {
  const JobDataRenderer = job.data && JOB_DATA_RENDERERS[job.type];
  if (!JobDataRenderer) {
    return null;
  }
  return <JobDataRenderer job={job} user={user} />;
};

export default JobData;
