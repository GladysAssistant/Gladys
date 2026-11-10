import { Text } from 'preact-i18n';
import cx from 'classnames';

import EditActions from './EditActions';
import ReorderDashbordList from './ReorderDashbordList';
import EditBoxColumns from './EditBoxColumns';
import LeaveConfirmDialog from './LeaveConfirmDialog';
import { isEditPanelOpen } from './EditPanel';
import style from '../style.css';
import editStyle from './style.css';
import get from 'get-value';
import { getBackgroundSceneClass } from '../backgroundScenes';

const EditDashboard = ({ children, ...props }) => {
  const panelOpen = isEditPanelOpen({ ...props, homeDashboard: props.currentDashboard });
  return (
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
                class={cx('container', style.largeContainer, editStyle.editorContainer, {
                  // live preview of the "full" width while editing
                  [style.fullWidthContainer]: get(props, 'currentDashboard.width') === 'full',
                  // room to scroll the last widgets up above the mobile sheet
                  [editStyle.editorContainerUnderPanel]: panelOpen
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
                      requestNavigation={props.requestNavigation}
                    />
                  </div>
                )}
                {/* v2: the canvas sits directly on the glass scene, no wrapping card */}
                {props.currentDashboard && <EditBoxColumns {...props} homeDashboard={props.currentDashboard} />}

                <EditActions {...props} />

                {/* Removing a widget asks nothing: this toast brings it back.
                  Not over an open sheet, whose content it would cover: the
                  offer still stands and shows again once the sheet closes */}
                {props.undoRemoval && !panelOpen && (
                  <div class={editStyle.undoToast} role="status" data-cy="widget-undo">
                    <span class={editStyle.undoToastMessage}>
                      <strong>
                        <Text id={`dashboard.boxTitle.${props.undoRemoval.type}`} />
                      </strong>
                      {' · '}
                      <Text id="dashboard.widgetRemoved" />
                    </span>
                    <button type="button" class={editStyle.undoToastButton} onClick={props.undoRemoveBox}>
                      <Text id="dashboard.boxes.devices.undo" />
                    </button>
                  </div>
                )}

                {props.leaveConfirm && (
                  <LeaveConfirmDialog onConfirm={props.confirmLeave} onCancel={props.cancelLeave} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditDashboard;
