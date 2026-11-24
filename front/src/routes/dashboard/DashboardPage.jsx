import { Text, Localizer } from 'preact-i18n';
import { useEffect, useRef } from 'preact/hooks';
import { Link } from 'preact-router/match';
import DashboardTabs from './DashboardTabs';
import cx from 'classnames';
import BoxColumns from './BoxColumns';
import DashboardSwiper from './DashboardSwiper';
import GetStarted from './GetStarted';
import SetTabletMode from './SetTabletMode';
import QuickEditor from './quick-edit/QuickEditor';
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
      // mirrored on <html>: what the app shell renders on <body> above the dock (the toast of
      // a failed device command) has to follow it
      document.documentElement.style.setProperty('--dock-lift', `${lift}px`);
    };
    viewport.addEventListener('resize', updateDockLift);
    viewport.addEventListener('scroll', updateDockLift);
    updateDockLift();
    return () => {
      viewport.removeEventListener('resize', updateDockLift);
      viewport.removeEventListener('scroll', updateDockLift);
      document.documentElement.style.removeProperty('--dock-lift');
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
                    {/* fullscreen is pointless on a phone: hidden below tablet width.
                        Only for a loaded dashboard with widgets — not while the
                        configuration is still being fetched */}
                    {props.currentDashboard &&
                      !props.dashboardNotConfigured &&
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
                    {/* "+": add a device (or a widget) from the dashboard itself, without entering
                        the editor (in-place editing, quick-edit/QuickEditor). It is the action of
                        the mobile dock; a wall tablet keeps the plain edit button */}
                    {props.currentDashboard && !props.hideExitFullScreenButton && !props.tabletMode && (
                      <Localizer>
                        <button
                          onClick={props.openAddMenu}
                          class={cx('btn btn-outline-primary ml-2 d-inline-flex')}
                          data-cy="dashboard-add-button"
                          aria-haspopup="dialog"
                          title={<Text id="quickEdit.addMenuTitle" />}
                        >
                          <i class="fe fe-plus" />
                        </button>
                      </Localizer>
                    )}
                    {/* the editor stays one tap away on a desktop; on the mobile dock it is in the
                        menu of the "+" and in the long-press menu of every widget */}
                    {props.currentDashboard && !props.hideExitFullScreenButton && (
                      <Localizer>
                        <button
                          onClick={props.editDashboard}
                          class={cx('btn btn-outline-primary ml-2', {
                            'd-none d-lg-inline-flex': !props.tabletMode,
                            'd-inline-flex': props.tabletMode
                          })}
                          data-cy="edit-dashboard-button"
                          title={<Text id="dashboard.editDashboardButton" />}
                        >
                          <i class="fe fe-edit" />
                        </button>
                      </Localizer>
                    )}
                  </div>
                </div>
                {/* Gladys Plus only: not dismissible, it stays as long as the
                    Gateway reports no recovery codes for this user. The banner
                    lands after the Gateway answers, so it is announced through a
                    live region rendered from the start (screen readers ignore a
                    live region inserted together with its content) */}
                <div aria-live="polite">
                  {props.gatewayRecoveryCodesMissing && (
                    <div
                      class="alert alert-warning d-md-flex align-items-center"
                      data-cy="gateway-recovery-codes-banner"
                    >
                      <div class="flex-fill">
                        <i class="fe fe-shield mr-2" />
                        <Text id="dashboard.gatewayRecoveryCodesMissing" />
                      </div>
                      {/* stacked under the text on phones, at its right from tablet width */}
                      <Link
                        href="/dashboard/settings/security"
                        class={cx('btn btn-sm mt-2 mt-md-0 ml-md-3', style.recoveryCodesBannerButton)}
                      >
                        <Text id="dashboard.gatewayRecoveryCodesMissingButton" />
                      </Link>
                    </div>
                  )}
                </div>
                {props.gatewayInstanceNotFound && (
                  <div class="alert alert-warning">
                    <Text id="dashboard.gatewayInstanceNotFoundError" />
                  </div>
                )}
                {/* a live region that is always there: a failure after the page mounted is read */}
                <div aria-live="polite">
                  {props.dashboardLoadFailed && (
                    <div class="alert alert-warning" data-cy="dashboard-load-error">
                      <Text id="dashboard.loadError" />
                    </div>
                  )}
                </div>
                {props.tabletModeParamError && (
                  <div class="alert alert-danger" data-cy="tablet-mode-param-error">
                    <Text id="dashboard.tabletModeParamError" fields={{ value: props.tabletModeParamError }} />
                  </div>
                )}
                {props.tabletModeActivationFailed && (
                  <div class="alert alert-danger" data-cy="tablet-mode-activation-error">
                    <Text id="dashboard.tabletModeActivationError" />
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
                {!props.dashboardNotConfigured && (
                  <QuickEditor
                    currentDashboard={props.currentDashboard}
                    tabletMode={props.tabletMode}
                    addMenuOpen={props.quickAddMenuOpen}
                    closeAddMenu={props.closeAddMenu}
                    openEditor={props.openEditor}
                    onDashboardSaved={props.onDashboardSaved}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
