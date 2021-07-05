import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import cx from 'classnames';
import BoxColumns from './BoxColumns';
import EditBoxColumns from './EditBoxColumns';
import EmptyState from './EmptyState';
import EditActions from './EditActions';

const marginBottom = {
  marginBottom: '10rem'
};

const DashboardPage = ({ children, ...props }) => (
  <div class="page">
    <div class="page-main">
      <div class="my-3 my-md-5">
        <div class="container" style={props.dashboardEditMode ? marginBottom : {}}>
          <div class="page-header">
            <div class="page-title">
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
            </div>

            <div class="page-options d-flex">
              {!props.dashboardEditMode && (
                <button onClick={props.editDashboard} class="btn btn-outline-primary btn-sm ml-2">
                  <span>
                    <Text id="dashboard.editDashboardButton" /> <i class="fe fe-edit" />
                  </span>
                </button>
              )}
              {!props.dashboardEditMode && (
                <button onClick={props.editDashboard} class="btn btn-outline-success btn-sm ml-2">
                  <span>
                    <Text id="dashboard.newDashboardButton" /> <i class="fe fe-plus" />
                  </span>
                </button>
              )}
            </div>
          </div>
          {props.gatewayInstanceNotFound && (
            <div class="alert alert-warning">
              <Text id="dashboard.gatewayInstanceNotFoundError" />
            </div>
          )}
          {props.dashboardNotConfigured && !props.dashboardEditMode && <EmptyState />}
          {!props.dashboardNotConfigured && !props.dashboardEditMode && (
            <BoxColumns homeDashboard={props.currentDashboard} />
          )}
          {props.dashboardEditMode && (
            <EditBoxColumns
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
);

export default DashboardPage;
