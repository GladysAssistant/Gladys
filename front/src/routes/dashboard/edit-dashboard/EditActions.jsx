import { Text } from 'preact-i18n';
import cx from 'classnames';

import style from './style.css';

const EditActions = props => (
  <div class={cx('fixed-bottom footer', style.editActionsFooter)}>
    <div class="container">
      <div class="row align-items-center flex-row-reverse">
        {!props.askDeleteDashboard && (
          <div class="col-auto">
            {/* cancel only makes sense while there is something to discard */}
            {props.hasUnsavedChanges && (
              <button onClick={props.cancelDashboardEdit} className="btn btn-outline-secondary btn-sm ml-2">
                <Text id="dashboard.editDashboardCancelButton" /> <i class="fe fe-slash" />
              </button>
            )}
            <button onClick={props.askDeleteCurrentDashboard} className="btn btn-outline-danger btn-sm ml-2">
              <Text id="dashboard.editDashboardDeleteButton" /> <i class="fe fe-trash" />
            </button>
            {/* saving keeps the user in the editor (chain editing): the
                confirmation is a transient label that never blocks anything —
                the moment everything is saved, leaving is available */}
            {props.justSaved && (
              <span className="text-success ml-2" data-cy="dashboard-saved-label">
                <Text id="dashboard.editDashboardSavedButton" /> <i class="fe fe-check" />
              </span>
            )}
            {props.hasUnsavedChanges && (
              <button onClick={props.saveDashboard} className="btn btn-outline-primary btn-sm ml-2">
                <Text id="dashboard.editDashboardSaveButton" /> <i class="fe fe-check" />
              </button>
            )}
            {!props.hasUnsavedChanges && (
              <button onClick={props.cancelDashboardEdit} className="btn btn-outline-primary btn-sm ml-2">
                <Text id="dashboard.editDashboardDoneButton" /> <i class="fe fe-check" />
              </button>
            )}
          </div>
        )}

        {props.askDeleteDashboard && (
          <div class="col-auto">
            <Text id="dashboard.editDashboardDeleteText" />
            <button onClick={props.deleteCurrentDashboard} className="btn btn-outline-danger btn-sm ml-2">
              <Text id="dashboard.editDashboardDeleteButton" /> <i class="fe fe-trash" />
            </button>
            <button onClick={props.cancelDeleteCurrentDashboard} className="btn btn-outline-secondary btn-sm ml-2">
              <Text id="dashboard.editDashboardCancelButton" /> <i class="fe fe-slash" />
            </button>
          </div>
        )}
      </div>
    </div>
  </div>
);

export default EditActions;
