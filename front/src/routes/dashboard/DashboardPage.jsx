import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import cx from 'classnames';
import BoxColumns from './BoxColumns';
import EmptyState from './EmptyState';
import SetTabletMode from './SetTabletMode';

import style from './style.css';

const DashboardPage = ({ children, ...props }) => (
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
                            href={`/dashboard/${dashboard.selector}`}
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
                  {!props.isGladysPlus && (
                    <button onClick={props.toggleDefineTabletMode} class={cx('btn btn-outline-secondary ml-2')}>
                      <span class={style.editDashboardText}>
                        {props.defineTabletModeOpened ? (
                          <Text id="dashboard.closeDefineTabletMode" />
                        ) : (
                          <Text id="dashboard.toggleDefineTabletMode" />
                        )}
                      </span>{' '}
                      <i class="fe fe-tablet" />
                    </button>
                  )}
                  {!props.dashboardNotConfigured &&
                    props.browserFullScreenCompatible &&
                    !props.hideExitFullScreenButton && (
                      <button onClick={props.toggleFullScreen} class={cx('btn btn-outline-secondary ml-2 btn-sm')}>
                        <span>
                          {!props.fullScreen && <Text id="dashboard.enableFullScreen" />}
                          {props.fullScreen && <Text id="dashboard.disableFullScreen" />}{' '}
                          {!props.fullScreen && <i class="fe fe-maximize-2" />}
                          {props.fullScreen && <i class="fe fe-minimize-2" />}
                        </span>
                      </button>
                    )}
                  {props.currentDashboard && !props.hideExitFullScreenButton && (
                    <button onClick={props.editDashboard} class={cx('btn btn-outline-primary ml-2')}>
                      <span class={style.editDashboardText}>
                        <Text id="dashboard.editDashboardButton" />
                      </span>{' '}
                      <i class="fe fe-edit" />
                    </button>
                  )}
                </div>
              </div>
              {props.gatewayInstanceNotFound && (
                <div class="alert alert-warning">
                  <Text id="dashboard.gatewayInstanceNotFoundError" />
                </div>
              )}
              <SetTabletMode
                toggleDefineTabletMode={props.toggleDefineTabletMode}
                defineTabletModeOpened={props.defineTabletModeOpened}
              />
              {props.dashboardNotConfigured && <EmptyState dashboardListEmpty={props.dashboardListEmpty} />}
              {!props.dashboardNotConfigured && <BoxColumns homeDashboard={props.currentDashboard} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default DashboardPage;
