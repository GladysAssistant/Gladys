import { Text, Localizer } from 'preact-i18n';
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
              <div class="row">
                {/* on mobile the canvas comes first, the dashboard list after */}
                <div class="col-lg-3 order-2 order-lg-1">
                  {/* Horizon glass panel, like the section frames of the canvas */}
                  <div class={editStyle.dashboardListPanel}>
                    <div class={editStyle.dashboardListHeader}>
                      <Text id="dashboard.editDashboardMyDashboards" />
                      {/* creation happens in the edit panel: the user never leaves the editor */}
                      <Localizer>
                        <button
                          type="button"
                          onClick={props.openNewDashboard}
                          class={editStyle.previewButton}
                          data-cy="new-dashboard-button"
                          title={<Text id="newDashboard.cardTitle" />}
                        >
                          <i class="fe fe-plus" />
                        </button>
                      </Localizer>
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
