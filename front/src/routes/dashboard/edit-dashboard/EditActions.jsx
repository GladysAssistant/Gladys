import { Text } from 'preact-i18n';
import cx from 'classnames';

import style from './style.css';

// Fixed action bar of the editor. On mobile it slides away while the edit
// panel (a bottom sheet there) is open: the sheet takes the whole bottom of
// the screen and carries its own actions, and the bar comes back — with
// Save — as soon as the sheet closes.
const EditActions = props => {
  const panelOpen = Boolean(props.editingBoxPosition) || props.dashboardSettingsOpen || props.newDashboardOpen;
  return (
    <div
      class={cx('fixed-bottom footer', style.editActionsFooter, { [style.editActionsFooterUnderPanel]: panelOpen })}
      data-cy="edit-actions"
    >
      <div class="container">
        {/* the actions are one wrapping, right-aligned row: on a narrow phone
            the three labels of a verbose language (fr: Annuler / Supprimer /
            Sauvegarder) are wider than the screen, and a single non-wrapping
            row overflowed off the LEFT edge — "Annuler" ended up half out of
            the viewport, out of reach */}
        <div class={style.editActionsRow}>
          {!props.askDeleteDashboard && (
            <>
              {/* cancel only makes sense while there is something to discard */}
              {props.hasUnsavedChanges && (
                <button onClick={props.cancelDashboardEdit} className="btn btn-outline-secondary btn-sm">
                  <Text id="dashboard.editDashboardCancelButton" /> <i class="fe fe-slash" />
                </button>
              )}
              <button onClick={props.askDeleteCurrentDashboard} className="btn btn-outline-danger btn-sm">
                <Text id="dashboard.editDashboardDeleteButton" /> <i class="fe fe-trash" />
              </button>
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
            </>
          )}

          {props.askDeleteDashboard && (
            <>
              <span class={style.editActionsQuestion}>
                <Text id="dashboard.editDashboardDeleteText" />
              </span>
              <button onClick={props.deleteCurrentDashboard} className="btn btn-outline-danger btn-sm">
                <Text id="dashboard.editDashboardDeleteButton" /> <i class="fe fe-trash" />
              </button>
              <button onClick={props.cancelDeleteCurrentDashboard} className="btn btn-outline-secondary btn-sm">
                <Text id="dashboard.editDashboardCancelButton" /> <i class="fe fe-slash" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditActions;
