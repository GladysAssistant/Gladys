import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import style from './style.css';

const EmptyState = ({ children, ...props }) => (
  <div class={style.emptyStateDivBox}>
    <img src="/assets/images/undraw_personalization.svg" class={style.emptyStateImage} />
    <p class={style.emptyStateText}>
      <Text id="dashboard.emptyDashboardSentenceTop" />
      <br /> {!props.dashboardListEmpty && <Text id="dashboard.emptyDashboardSentenceBottom" />}
      {props.dashboardListEmpty && <Text id="dashboard.noDashboardSentenceBottom" />}
    </p>
    {props.dashboardListEmpty && (
      <Link href="/dashboard/create/new" class="btn btn-success">
        <Text id="dashboard.newDashboardButton" /> <i class="fe fe-plus" />
      </Link>
    )}
  </div>
);

export default EmptyState;
