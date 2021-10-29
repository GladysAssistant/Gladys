import SettingsLayout from '../SettingsLayout';
import JobList from './JobList';

const SettingsBackgroubJobsPage = ({ jobs, scheduledJobs, user }) => (
  <SettingsLayout>
    <JobList jobs={jobs} scheduledJobs={scheduledJobs} user={user} />
  </SettingsLayout>
);

export default SettingsBackgroubJobsPage;
