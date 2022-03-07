import SettingsLayout from '../SettingsLayout';
import JobList from './JobList';

const SettingsBackgroubJobsPage = ({ jobs, user, loadNextPage, loadPreviousPage, isFirstPage, isLastPage }) => (
  <SettingsLayout>
    <JobList
      jobs={jobs}
      user={user}
      loadNextPage={loadNextPage}
      loadPreviousPage={loadPreviousPage}
      isFirstPage={isFirstPage}
      isLastPage={isLastPage}
    />
  </SettingsLayout>
);

export default SettingsBackgroubJobsPage;
