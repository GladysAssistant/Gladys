import { Text } from 'preact-i18n';

const EditActions = props => (
  <div class="fixed-bottom footer">
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
            {/* saving keeps the user in the editor (chain editing): the button
                briefly becomes the confirmation, then — everything being saved —
                the primary action becomes leaving the editor */}
            {props.justSaved && (
              <button className="btn btn-success btn-sm ml-2">
                <Text id="dashboard.editDashboardSavedButton" /> <i class="fe fe-check" />
              </button>
            )}
            {!props.justSaved && props.hasUnsavedChanges && (
              <button onClick={props.saveDashboard} className="btn btn-outline-primary btn-sm ml-2">
                <Text id="dashboard.editDashboardSaveButton" /> <i class="fe fe-check" />
              </button>
            )}
            {!props.justSaved && !props.hasUnsavedChanges && (
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
