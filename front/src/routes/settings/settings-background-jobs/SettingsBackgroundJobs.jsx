import SettingsLayout from '../SettingsLayout';
import JobList from './JobList';
import MobileJobList from './MobileJobList';
import { withMobileViewport } from '../../../components/mobile';

// On a phone the jobs are rows (docs/specs/mobile-pages/settings-pages.md, D): same props
const SettingsBackgroundJobsPage = ({ isMobile, ...props }) => {
  const List = isMobile ? MobileJobList : JobList;
  return (
    <SettingsLayout>
      <List
        jobs={props.jobs}
        user={props.user}
        loadNextPage={props.loadNextPage}
        loadPreviousPage={props.loadPreviousPage}
        isFirstPage={props.isFirstPage}
        isLastPage={props.isLastPage}
      />
    </SettingsLayout>
  );
};

export default withMobileViewport(SettingsBackgroundJobsPage);
