import { Text } from 'preact-i18n';
import BoxColumns from './BoxColumns';
import EditBoxColumns from './EditBoxColumns';
import EmptyState from './EmptyState';

const DashboardPage = ({ children, ...props }) => (
  <div class="page">
    <div class="page-main">
      <div class="my-3 my-md-5">
        <div class="container">
          <div class="page-header">
            <h1 class="page-title">Dashboard</h1>
            <div class="page-options d-flex">
              {!props.dashboardEditMode && (
                <button onClick={props.editDashboard} class="btn btn-outline-primary btn-sm ml-2">
                  <span>
                    Edit <i class="fe fe-edit" />
                  </span>
                </button>
              )}
              {props.dashboardEditMode && (
                <button onClick={props.cancelDashboardEdit} class="btn btn-outline-danger btn-sm ml-2">
                  <span>
                    Cancel <i class="fe fe-slash" />
                  </span>
                </button>
              )}
              {props.dashboardEditMode && (
                <button onClick={props.saveDashboard} class="btn btn-outline-primary btn-sm ml-2">
                  <span>
                    Save <i class="fe fe-check" />
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
            <BoxColumns homeDashboard={props.homeDashboard} />
          )}
          {props.dashboardEditMode && (
            <EditBoxColumns
              editDashboardDragEnable={props.editDashboardDragEnable}
              moveCard={props.moveCard}
              moveBoxUp={props.moveBoxUp}
              moveBoxDown={props.moveBoxDown}
              addBox={props.addBox}
              homeDashboard={props.homeDashboard}
              updateNewSelectedBox={props.updateNewSelectedBox}
              removeBox={props.removeBox}
            />
          )}
        </div>
      </div>
    </div>
  </div>
);

export default DashboardPage;
