import { Text } from 'preact-i18n';
import style from './style.css';

const EmptyState = ({ children, ...props }) => (
  <div class={style.emptyStateDivBox}>
    <img src="/assets/images/undraw_personalization.svg" class={style.emptyStateImage} />
    <p class={style.emptyStateText}>
      <Text id="dashboard.emptyDashboardSentenceTop" />
      <br /> {!props.dashboardListEmpty && <Text id="dashboard.emptyDashboardSentenceBottom" />}
      {props.dashboardListEmpty && <Text id="dashboard.noDashboardSentenceBottom" />}
    </p>
  </div>
);

export default EmptyState;
