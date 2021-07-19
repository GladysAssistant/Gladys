import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import cx from 'classnames';
import BoxColumns from './BoxColumns';
import EditBoxColumns from './EditBoxColumns';
import EmptyState from './EmptyState';
import EditActions from './EditActions';

import style from './style.css';

const marginBottom = {
  marginBottom: '10rem'
};

const DashboardPage = ({ children, ...props }) => (
  <div class="page">
    <div class="page-main">
      <div class={props.loading ? 'dimmer active' : 'dimmer'}>
        <div class="loader" />
        <div class="dimmer-content">
          <div class="my-3 my-md-5">
            <div class="container" style={props.dashboardEditMode ? marginBottom : {}}>
              {!props.dashboardEditMode && (
                <div class="page-header">
                  <div class="page-title">
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
                          {props.dashboards.map((dashboard, index) => (
                            <Link
                              class="dropdown-item"
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
                    {!props.dashboardNotConfigured && props.browserFullScreenCompatible && (
                      <button onClick={props.toggleFullScreen} class={cx('btn btn-outline-secondary ml-2 btn-sm')}>
                        <span>
                          {!props.fullScreen && <Text id="dashboard.enableFullScreen" />}
                          {props.fullScreen && <Text id="dashboard.disableFullScreen" />}{' '}
                          {!props.fullScreen && <i class="fe fe-maximize-2" />}
                          {props.fullScreen && <i class="fe fe-minimize-2" />}
                        </span>
                      </button>
                    )}
                    {props.currentDashboard && (
                      <button
                        onClick={props.editDashboard}
                        class={cx('btn btn-outline-primary ml-2', style.smallButtonOnBigScreen)}
                      >
                        <span>
                          <Text id="dashboard.editDashboardButton" /> <i class="fe fe-edit" />
                        </span>
                      </button>
                    )}
                    <Link
                      href="/dashboard/create/new"
                      class={cx('btn btn-outline-success ml-2', style.smallButtonOnBigScreen)}
                    >
                      <span>
                        <Text id="dashboard.newDashboardButton" /> <i class="fe fe-plus" />
                      </span>
                    </Link>
                  </div>
                </div>
              )}
              {props.gatewayInstanceNotFound && (
                <div class="alert alert-warning">
                  <Text id="dashboard.gatewayInstanceNotFoundError" />
                </div>
              )}
              {props.dashboardNotConfigured && !props.dashboardEditMode && (
                <EmptyState dashboardListEmpty={props.dashboardListEmpty} />
              )}
              {!props.dashboardNotConfigured && !props.dashboardEditMode && (
                <BoxColumns homeDashboard={props.currentDashboard} />
              )}
              {props.dashboardEditMode && (
                <EditBoxColumns
                  updateCurrentDashboardName={props.updateCurrentDashboardName}
                  editDashboardDragEnable={props.editDashboardDragEnable}
                  moveCard={props.moveCard}
                  moveBoxUp={props.moveBoxUp}
                  moveBoxDown={props.moveBoxDown}
                  addBox={props.addBox}
                  homeDashboard={props.currentDashboard}
                  updateNewSelectedBox={props.updateNewSelectedBox}
                  removeBox={props.removeBox}
                  updateBoxConfig={props.updateBoxConfig}
                />
              )}
              {props.dashboardEditMode && <EditActions {...props} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default DashboardPage;
