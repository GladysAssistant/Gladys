import { connect } from 'unistore/preact';
import actions from '../../actions/dashboard';
import BoxColumns from './BoxColumns';
import EditBoxColumns from './EditBoxColumns';
import EmptyState from './EmptyState';

const DashboardPage = connect(
  'user,dashboardEditMode,dashboardNotConfigured,editDashboardDragEnable,homeDashboard',
  actions
)(
  ({
    user,
    editDashboard,
    dashboardEditMode,
    dashboardNotConfigured,
    onDragStart,
    editDashboardDragEnable,
    moveCard,
    homeDashboard,
    addBox,
    moveBoxUp,
    moveBoxDown,
    updateNewSelectedBox,
    removeBox,
    saveDashboard,
    cancelDashboardEdit,
    onDragOver,
    onDrop
  }) => (
    <div class="page">
      <div class="page-main">
        <div class="my-3 my-md-5">
          <div class="container">
            <div class="page-header">
              <h1 class="page-title">Dashboard</h1>
              <div class="page-options d-flex">
                {!dashboardEditMode && (
                  <button onClick={editDashboard} class="btn btn-outline-primary btn-sm ml-2">
                    <span>
                      Edit <i class="fe fe-edit" />
                    </span>
                  </button>
                )}
                {dashboardEditMode && (
                  <button onClick={cancelDashboardEdit} class="btn btn-outline-danger btn-sm ml-2">
                    <span>
                      Cancel <i class="fe fe-slash" />
                    </span>
                  </button>
                )}
                {dashboardEditMode && (
                  <button onClick={saveDashboard} class="btn btn-outline-primary btn-sm ml-2">
                    <span>
                      Save <i class="fe fe-check" />
                    </span>
                  </button>
                )}
              </div>
            </div>
            {dashboardNotConfigured && !dashboardEditMode && <EmptyState />}
            {!dashboardNotConfigured && !dashboardEditMode && <BoxColumns homeDashboard={homeDashboard} />}
            {dashboardEditMode && (
              <EditBoxColumns
                onDragStart={onDragStart}
                onDrop={onDrop}
                onDragOver={onDragOver}
                editDashboardDragEnable={editDashboardDragEnable}
                moveCard={moveCard}
                moveBoxUp={moveBoxUp}
                moveBoxDown={moveBoxDown}
                addBox={addBox}
                homeDashboard={homeDashboard}
                updateNewSelectedBox={updateNewSelectedBox}
                removeBox={removeBox}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
);

export default DashboardPage;
