import { Text } from 'preact-i18n';
import DashboardTabs from './DashboardTabs';
import cx from 'classnames';
import BoxColumns from './BoxColumns';
import EmptyState from './EmptyState';
import SetTabletMode from './SetTabletMode';
import { JOB_STATUS } from '../../../../server/utils/constants';

import style from './style.css';

const DashboardPage = ({ children, ...props }) => {
  const rawBackgroundImage = props.currentDashboard && props.currentDashboard.background_image;
  // Server-side validation enforces this too; the front never interpolates
  // anything but an http(s) URL into the CSS url() (JSON quoting escapes
  // quotes and backslashes, the scheme check closes the rest)
  const backgroundImage = rawBackgroundImage && /^https?:\/\//.test(rawBackgroundImage) ? rawBackgroundImage : null;
  const fullWidth = props.currentDashboard && props.currentDashboard.width === 'full';
  return (
    <div class="page">
      {/* The Horizon glass theme is THE dashboard style — imposed, not chosen */}
      <div
        class={cx('page-main', 'glass-theme', style.dashboardBackground, {
          // built-in scene, only when no background image is configured
          [style.glassScene]: !backgroundImage
        })}
        style={backgroundImage ? `background-image: url(${JSON.stringify(backgroundImage)})` : undefined}
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

                  <div class="page-options d-flex align-content-between flex-wrap">
                    {/* configuring a wall tablet only makes sense on a tablet-sized
                        screen: hidden on phones */}
                    {!props.isGladysPlus && (
                      <button
                        onClick={props.toggleDefineTabletMode}
                        class={cx('btn btn-outline-secondary ml-2 d-none d-md-inline-block')}
                      >
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
                    {/* fullscreen is pointless on a phone: hidden below tablet width */}
                    {!props.dashboardNotConfigured &&
                      props.browserFullScreenCompatible &&
                      !props.hideExitFullScreenButton && (
                        <button
                          onClick={props.toggleFullScreen}
                          class={cx('btn btn-outline-secondary ml-2 d-none d-md-inline-block')}
                        >
                          <span class={style.editDashboardText}>
                            {!props.fullScreen && <Text id="dashboard.enableFullScreen" />}
                            {props.fullScreen && <Text id="dashboard.disableFullScreen" />}
                          </span>{' '}
                          {!props.fullScreen && <i class="fe fe-maximize-2" />}
                          {props.fullScreen && <i class="fe fe-minimize-2" />}
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
