import { Text, Localizer } from 'preact-i18n';
import DashboardTabs from './DashboardTabs';
import cx from 'classnames';
import BoxColumns from './BoxColumns';
import EmptyState from './EmptyState';
import SetTabletMode from './SetTabletMode';
import { JOB_STATUS } from '../../../../server/utils/constants';

import style from './style.css';
import { getBackgroundSceneClass } from './backgroundScenes';

const DashboardPage = ({ children, ...props }) => {
  const backgroundScene = props.currentDashboard && props.currentDashboard.background_scene;
  const fullWidth = props.currentDashboard && props.currentDashboard.width === 'full';
  return (
    <div class="page">
      {/* The Horizon glass theme is THE dashboard style — imposed, not chosen */}
      {/* withBottomDock: this is the one wallpaper page carrying the mobile
          switcher dock, so it is the one that pads its content clear of it */}
      <div
        class={cx(
          'page-main',
          'glass-theme',
          style.dashboardBackground,
          style.withBottomDock,
          getBackgroundSceneClass(backgroundScene)
        )}
      >
        <div class={props.loading ? 'dimmer active' : 'dimmer'}>
          <div class="loader" />
          <div class="dimmer-content">
            <div class="my-3 my-md-5 dashboard">
              <div class={cx('container', { [style.fullWidthContainer]: fullWidth })}>
                <div class={cx('page-header', style.dashboardHeader)}>
                  <div class={style.dashboardHeaderTabs}>
                    {/* One-tap pills in every mode; pills that don't fit on one
                        row collapse behind a "…" button opening the full list */}
                    {!props.dashboardListEmpty && (
                      <DashboardTabs
                        dashboards={props.dashboards}
                        currentDashboard={props.currentDashboard}
                        tabletMode={props.tabletMode}
                        redirectToDashboard={props.redirectToDashboard}
                      />
                    )}
                  </div>

                  {/* Actions are icon pills matching the bar's height, on the
                      bar's own row at every width — never a second line */}
                  <div class="page-options d-flex">
                    {/* configuring a wall tablet only makes sense on a tablet-sized
                        screen: hidden on phones */}
                    {!props.isGladysPlus && (
                      <Localizer>
                        <button
                          onClick={props.toggleDefineTabletMode}
                          class={cx('btn btn-outline-secondary ml-2 d-none d-md-inline-flex')}
                          title={
                            props.defineTabletModeOpened ? (
                              <Text id="dashboard.closeDefineTabletMode" />
                            ) : (
                              <Text id="dashboard.toggleDefineTabletMode" />
                            )
                          }
                        >
                          <i class={props.defineTabletModeOpened ? 'fe fe-x' : 'fe fe-tablet'} />
                        </button>
                      </Localizer>
                    )}
                    {/* fullscreen is pointless on a phone: hidden below tablet width */}
                    {!props.dashboardNotConfigured &&
                      props.browserFullScreenCompatible &&
                      !props.hideExitFullScreenButton && (
                        <Localizer>
                          <button
                            onClick={props.toggleFullScreen}
                            class={cx('btn btn-outline-secondary ml-2 d-none d-md-inline-flex')}
                            title={
                              props.fullScreen ? (
                                <Text id="dashboard.disableFullScreen" />
                              ) : (
                                <Text id="dashboard.enableFullScreen" />
                              )
                            }
                          >
                            {!props.fullScreen && <i class="fe fe-maximize-2" />}
                            {props.fullScreen && <i class="fe fe-minimize-2" />}
                          </button>
                        </Localizer>
                      )}
                    {props.currentDashboard && !props.hideExitFullScreenButton && (
                      <Localizer>
                        <button
                          onClick={props.editDashboard}
                          class={cx('btn btn-outline-primary ml-2 d-inline-flex')}
                          data-cy="edit-dashboard-button"
                          title={<Text id="dashboard.editDashboardButton" />}
                        >
                          <i class="fe fe-edit" />
                        </button>
                      </Localizer>
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
                {props.duckDbMigrationJob && props.duckDbMigrationJob.status === JOB_STATUS.IN_PROGRESS && (
                  <div class="alert alert-info">
                    <Text id="dashboard.duckDbMigrationInProgress" fields={props.duckDbMigrationJob} />
                  </div>
                )}
                {props.dashboardNotConfigured && <EmptyState dashboardListEmpty={props.dashboardListEmpty} />}
                {!props.dashboardNotConfigured && <BoxColumns homeDashboard={props.currentDashboard} />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
