import SettingsLayout from '../SettingsLayout';
import JobList from './JobList';

const SettingsBackgroubJobsPage = ({ jobs, user }) => (
  <SettingsLayout>
    <JobList jobs={jobs} user={user} />
  </SettingsLayout>
);

export default SettingsBackgroubJobsPage;
