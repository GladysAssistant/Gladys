import { Text, Localizer } from 'preact-i18n';
import { useEffect, useRef } from 'preact/hooks';
import DashboardTabs from './DashboardTabs';
import cx from 'classnames';
import BoxColumns from './BoxColumns';
import DashboardSwiper from './DashboardSwiper';
import GetStarted from './GetStarted';
import SetTabletMode from './SetTabletMode';
import { JOB_STATUS } from '../../../../server/utils/constants';

import style from './style.css';
import { getBackgroundSceneClass } from './backgroundScenes';

const DashboardPage = ({ children, ...props }) => {
  const backgroundScene = props.currentDashboard && props.currentDashboard.background_scene;
  const fullWidth = props.currentDashboard && props.currentDashboard.width === 'full';

  // On mobile the switcher is position: fixed at the bottom — attached to the
  // LAYOUT viewport. While iOS Safari animates its toolbars during a scroll,
  // the layout viewport's bottom edge transiently sits below what is actually
  // visible, and the dock disappears under the toolbar. The VisualViewport
  // API reports the truly visible area continuously, so the dock is lifted by
  // however much of the layout viewport's bottom is currently overlaid.
  const dockRef = useRef(null);
  useEffect(() => {
    // eslint-disable-next-line compat/compat
    const viewport = window.visualViewport;
    if (!viewport) {
      // pre-13 iOS / very old wall tablets: dock keeps the plain fixed behavior
      return undefined;
    }
    const updateDockLift = () => {
      if (!dockRef.current) {
        return;
      }
      const overlaid = window.innerHeight - viewport.height - viewport.offsetTop;
      // a pinch-zoom also shrinks the visual viewport, but overlays nothing
      const lift = viewport.scale > 1.01 ? 0 : Math.max(0, Math.round(overlaid));
      dockRef.current.style.setProperty('--dock-lift', `${lift}px`);
    };
    viewport.addEventListener('resize', updateDockLift);
    viewport.addEventListener('scroll', updateDockLift);
    updateDockLift();
    return () => {
      viewport.removeEventListener('resize', updateDockLift);
      viewport.removeEventListener('scroll', updateDockLift);
    };
  }, []);

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
              {/* same width cap as the editor canvas: edit/view must not shift */}
              <div class={cx('container', style.largeContainer, { [style.fullWidthContainer]: fullWidth })}>
                {/* data-dashboard-swipe-ignore: a drag starting on the switcher
                    dock belongs to the dock, not to the page swipe gesture */}
                <div class={cx('page-header', style.dashboardHeader)} ref={dockRef} data-dashboard-swipe-ignore>
                  <div class={style.dashboardHeaderTabs}>
                    {/* One-tap pills in every mode. Desktop: pills that don't
                        fit on one row collapse behind a "…" button opening the
                        full list. Mobile dock: the pill track scrolls sideways
                        instead, and a list button opens the full named list. */}
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
                {/* On the mobile/touch layout the body is a pager: swiping
                    left/right switches to the neighboring dashboard. Not in
                    tablet mode — a docked wall tablet (a portrait iPad sits
                    inside the same breakpoint) must not switch on a brush. */}
                <DashboardSwiper
                  dashboards={props.dashboards}
                  dashboardConfigsBySelector={props.dashboardConfigsBySelector}
                  currentDashboard={props.currentDashboard}
                  currentDashboardSelector={props.currentDashboardSelector}
                  tabletMode={props.tabletMode}
                >
                  {props.dashboardNotConfigured && (
                    <GetStarted dashboardListEmpty={props.dashboardListEmpty} editDashboard={props.editDashboard} />
                  )}
                  {!props.dashboardNotConfigured && <BoxColumns homeDashboard={props.currentDashboard} />}
                </DashboardSwiper>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
