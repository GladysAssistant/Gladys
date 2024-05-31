import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import style from './style.css';

const EmptyState = ({ children, ...props }) => (
  <div class={style.emptyStateDivBox}>
    <img src="/assets/images/undraw_personalization.svg" class={style.emptyStateImage} />
    <p class={style.emptyStateText}>
      <Text id="charts-history.emptyChartsHistorySentenceTop" />
      <br /> {!props.dashboardListEmpty && <Text id="charts-history.emptyChartsHistorySentenceBottom" />}
      {props.dashboardListEmpty && <Text id="charts-history.noChartsHistorySentenceBottom" />}
    </p>
    {props.dashboardListEmpty && (
      <Link href="/dashboard/charts-history/create/new" class="btn btn-success">
        <Text id="charts-history.newChartsHistoryButton" /> <i class="fe fe-plus" />
      </Link>
    )}
  </div>
);

export default EmptyState;
