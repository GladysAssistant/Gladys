import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import cx from 'classnames';
import BoxColumns from './BoxColumns';
import EmptyState from './EmptyState';
import SetTabletMode from './SetTabletMode';
import { JOB_STATUS } from '../../../../server/utils/constants';
import { wrapEmojisJSX } from '../../utils/emojiWrapper';

import style from './style.css';

const DashboardPage = ({ children, ...props }) => {
  const rawBackgroundImage = props.currentDashboard && props.currentDashboard.background_image;
  // Server-side validation enforces this too; the front never interpolates
  // anything but an http(s) URL into the CSS url() (JSON quoting escapes
  // quotes and backslashes, the scheme check closes the rest)
  const backgroundImage = rawBackgroundImage && /^https?:\/\//.test(rawBackgroundImage) ? rawBackgroundImage : null;
  const glassCards = props.currentDashboard && props.currentDashboard.card_style === 'glass';
  const fullWidth = props.currentDashboard && props.currentDashboard.width === 'full';
  return (
    <div class="page">
      <div
        class={cx('page-main', {
          [style.dashboardBackground]: backgroundImage || glassCards,
          // default glass scene, only when no background image is configured
          [style.glassScene]: glassCards && !backgroundImage,
          'glass-theme': glassCards
        })}
        style={backgroundImage ? `background-image: url(${JSON.stringify(backgroundImage)})` : undefined}
      >
        <div class={props.loading ? 'dimmer active' : 'dimmer'}>
          <div class="loader" />
          <div class="dimmer-content">
            <div class="my-3 my-md-5 dashboard">
              <div class={cx('container', { [style.fullWidthContainer]: fullWidth })}>
                <div class="page-header">
                  <div>
                    {!props.dashboardListEmpty && props.tabletMode && (
                      <div class={style.dashboardTabs}>
                        {props.dashboards.map(dashboard => (
                          <Link
                            href={`/dashboard/${dashboard.selector}`}
                            onClick={props.redirectToDashboard}
                            class={cx(style.dashboardTab, {
                              [style.dashboardTabActive]:
                                props.currentDashboard && dashboard.selector === props.currentDashboard.selector
                            })}
                            title={dashboard.name}
                          >
                            <i class={`fe fe-${dashboard.icon || 'home'}`} />
                          </Link>
                        ))}
                      </div>
                    )}
                    {!props.dashboardListEmpty && !props.tabletMode && (
                      <div class="dropdown">
                        <button class="btn btn-secondary dropdown-toggle" onClick={props.toggleDashboardDropdown}>
                          {props.currentDashboard && wrapEmojisJSX(props.currentDashboard.name)}
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
                              {wrapEmojisJSX(dashboard.name)}
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
