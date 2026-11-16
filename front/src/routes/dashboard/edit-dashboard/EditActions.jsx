import { Text } from 'preact-i18n';
import cx from 'classnames';

import { isEditPanelOpen } from './EditPanel';
import style from './style.css';

// Fixed action bar of the editor. On mobile it slides away while the edit
// panel (a bottom sheet there) is open: the sheet takes the whole bottom of
// the screen and carries its own actions, and the bar comes back — with
// Save — as soon as the sheet closes.
const EditActions = props => {
  const panelOpen = isEditPanelOpen({ ...props, homeDashboard: props.currentDashboard });
  return (
    <div
      class={cx('fixed-bottom footer', style.editActionsFooter, { [style.editActionsFooterUnderPanel]: panelOpen })}
      data-cy="edit-actions"
    >
      <div class="container">
        {/* One row whatever the language: Cancel on the left (only while
            there is something to discard), the primary action on the right.
            Deleting the dashboard — rare and irreversible — moved to the
            dashboard settings, out of the way of Save. */}
        <div class={style.editActionsRow}>
          {props.hasUnsavedChanges && (
            <button
              onClick={props.cancelDashboardEdit}
              className={cx('btn btn-outline-secondary btn-sm', style.editActionsCancel)}
              data-cy="edit-cancel-button"
            >
              <Text id="dashboard.editDashboardCancelButton" />
            </button>
          )}
          {/* saving keeps the user in the editor (chain editing): the
              confirmation is a transient label that never blocks anything —
              the moment everything is saved, leaving is available */}
          {props.justSaved && (
            <span className="text-success" data-cy="dashboard-saved-label">
              <Text id="dashboard.editDashboardSavedButton" /> <i class="fe fe-check" />
            </span>
          )}
          {props.hasUnsavedChanges && (
            <button onClick={props.saveDashboard} className="btn btn-outline-primary btn-sm">
              <Text id="dashboard.editDashboardSaveButton" /> <i class="fe fe-check" />
            </button>
          )}
          {!props.hasUnsavedChanges && (
            <button onClick={props.cancelDashboardEdit} className="btn btn-outline-primary btn-sm">
              <Text id="dashboard.editDashboardDoneButton" /> <i class="fe fe-check" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditActions;
