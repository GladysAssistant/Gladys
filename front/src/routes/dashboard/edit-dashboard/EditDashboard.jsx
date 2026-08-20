import { Text } from 'preact-i18n';
import cx from 'classnames';

import EditActions from './EditActions';
import ReorderDashbordList from './ReorderDashbordList';
import EditBoxColumns from './EditBoxColumns';
import style from '../style.css';
import editStyle from './style.css';
import get from 'get-value';
import { getBackgroundSceneClass } from '../backgroundScenes';

const EditDashboard = ({ children, ...props }) => (
  <div class="page">
    {/* The editor lives on the same Horizon glass surface as the dashboard,
        with a live preview of the scene being edited */}
    <div
      class={cx(
        'page-main',
        'glass-theme',
        style.dashboardBackground,
        getBackgroundSceneClass(get(props, 'currentDashboard.background_scene'))
      )}
    >
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
              {/* The dashboard list is a wrapping row of pills above the canvas
                  (the viewer's tab-bar grammar) — a sidebar column stole a
                  quarter of the editor's width, painful on tablets. Creation
                  happens in the edit panel via the "+" pill: the user never
                  leaves the editor */}
              {props.currentDashboard && (
                <div class={editStyle.dashboardBar}>
                  <div class={editStyle.dashboardListHeader}>
                    <Text id="dashboard.editDashboardMyDashboards" />
                  </div>
                  <ReorderDashbordList
                    dashboards={props.dashboards}
                    currentDashboard={props.currentDashboard}
                    updateDashboardList={props.updateDashboardList}
                    openNewDashboard={props.openNewDashboard}
                  />
                </div>
              )}
              {/* v2: the canvas sits directly on the glass scene, no wrapping card */}
              {props.currentDashboard && <EditBoxColumns {...props} homeDashboard={props.currentDashboard} />}

              <EditActions {...props} />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default EditDashboard;
