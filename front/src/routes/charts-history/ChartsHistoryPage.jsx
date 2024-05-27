import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import cx from 'classnames';
import BoxColumns from './BoxColumns';
import EmptyState from './EmptyState';

import style from './style.css';

const ChartsHistoryPage = ({ children, ...props }) => (
  <div class="page">
    <div class="page-main">
      <div class={props.loading ? 'dimmer active' : 'dimmer'}>
        <div class="loader" />
        <div class="dimmer-content">
          <div class="my-3 my-md-5">
            <div class={cx('container')}>
              <div class="page-header">
                <div>
                  {!props.dashboardListEmpty && (
                    <div class="dropdown">
                      <button class="btn btn-secondary dropdown-toggle" onClick={props.toggleDashboardDropdown}>
                        {props.currentDashboard && props.currentDashboard.name}
                      </button>
                      <div
                        class={cx('dropdown-menu', {
                          show: props.dashboardDropdownOpened
                        })}
                      >
                        {props.dashboards.map(dashboard => (
                          <Link
                            class={cx('dropdown-item', style.dropdownItemBiggerLines)}
                            href={`/dashboard/charts-history/${dashboard.selector}`}
                            onClick={props.redirectToDashboard}
                          >
                            {dashboard.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div class="page-options d-flex align-content-between flex-wrap">
                  {props.currentDashboard && (
                    <button onClick={props.editDashboard} class={cx('btn btn-outline-primary ml-2')}>
                      <span class={style.editDashboardText}>
                        <Text id="dashboard.editChartsHistoryButton" />
                      </span>{' '}
                      <i class="fe fe-edit" />
                    </button>
                  )}
                </div>
              </div>
              {props.dashboardNotConfigured && <EmptyState dashboardListEmpty={props.dashboardListEmpty} />}
              {!props.dashboardNotConfigured && <BoxColumns homeDashboard={props.currentDashboard} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default ChartsHistoryPage;
