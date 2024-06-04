import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import cx from 'classnames';

import EditActions from './EditActions';
import ReorderDashbordList from './ReorderDashbordList';
import EditBoxColumns from './EditBoxColumns';
import style from '../style.css';
import get from 'get-value';

const EditDashboard = ({ children, ...props }) => (
  <div class="page">
    <div class="page-main">
      <div class={props.loading ? 'dimmer active' : 'dimmer'}>
        <div class="loader" />
        <div class="dimmer-content">
          <div class="my-3 my-md-5">
            <div class={cx('container', style.largeContainer)}>
              <div class="row">
                <div class="col-lg-3">
                  <div class="card">
                    <div class="card-header">
                      <h3 class="card-title">
                        <Text id="dashboard.editDashboardMyDashboards" />
                      </h3>
                      <div class="page-options d-flex">
                        <Link
                          href={`/dashboard/create/new?prev=${get(props, 'currentDashboard.selector')}`}
                          class={cx('btn btn-sm btn-secondary', style.smallButtonOnBigScreen)}
                        >
                          <span>+</span>
                        </Link>
                      </div>
                    </div>
                    {props.currentDashboard && (
                      <ReorderDashbordList
                        dashboards={props.dashboards}
                        currentDashboard={props.currentDashboard}
                        updateDashboardList={props.updateDashboardList}
                      />
                    )}
                  </div>
                </div>
                <div class="col-lg-9">
                  <div class="card">
                    <div class="card-body">
                      {props.currentDashboard && (
                        <EditBoxColumns
                          user={props.user}
                          isTouchDevice={props.isTouchDevice}
                          dashboards={props.dashboards}
                          updateCurrentDashboardName={props.updateCurrentDashboardName}
                          updateCurrentDashboardVisibility={props.updateCurrentDashboardVisibility}
                          editDashboardDragEnable={props.editDashboardDragEnable}
                          moveCard={props.moveCard}
                          moveBoxUp={props.moveBoxUp}
                          moveBoxDown={props.moveBoxDown}
                          addBox={props.addBox}
                          homeDashboard={props.currentDashboard}
                          updateNewSelectedBox={props.updateNewSelectedBox}
                          removeBox={props.removeBox}
                          updateBoxConfig={props.updateBoxConfig}
                          showReorderDashboard={props.showReorderDashboard}
                          toggleReorderDashboard={props.toggleReorderDashboard}
                          updateDashboardList={props.updateDashboardList}
                          savingNewDashboardList={props.savingNewDashboardList}
                          isMobileReordering={props.isMobileReordering}
                          toggleMobileReorder={props.toggleMobileReorder}
                          deleteCurrentColumn={props.deleteCurrentColumn}
                          addColumn={props.addColumn}
                          boxNotEmptyError={props.boxNotEmptyError}
                          columnBoxNotEmptyError={props.columnBoxNotEmptyError}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <EditActions {...props} />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default EditDashboard;
