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
    {/* The editor lives on the same Horizon glass surface as the dashboard */}
    <div class={cx('page-main', 'glass-theme', style.dashboardBackground, style.glassScene)}>
      <div class={props.loading ? 'dimmer active' : 'dimmer'}>
        <div class="loader" />
        <div class="dimmer-content">
          <div class="my-3 my-md-5">
            <div
              class={cx('container', style.largeContainer, {
                // live preview of the "full" width while editing
                [style.fullWidthContainer]: get(props, 'currentDashboard.width') === 'full'
              })}
            >
              <div class="row">
                {/* on mobile the canvas comes first, the dashboard list after */}
                <div class="col-lg-3 order-2 order-lg-1">
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
                <div class="col-lg-9 order-1 order-lg-2">
                  {/* v2: the canvas sits directly on the glass scene, no wrapping card */}
                  {props.currentDashboard && <EditBoxColumns {...props} homeDashboard={props.currentDashboard} />}
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
