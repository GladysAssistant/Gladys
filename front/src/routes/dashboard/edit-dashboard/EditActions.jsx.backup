import { Text } from 'preact-i18n';

const EditActions = props => (
  <div class="fixed-bottom footer">
    <div class="container">
      <div class="row align-items-center flex-row-reverse">
        {!props.askDeleteDashboard && (
          <div class="col-auto">
            <button onClick={props.cancelDashboardEdit} className="btn btn-outline-secondary btn-sm ml-2">
              <Text id="dashboard.editDashboardCancelButton" /> <i class="fe fe-slash" />
            </button>
            <button onClick={props.askDeleteCurrentDashboard} className="btn btn-outline-danger btn-sm ml-2">
              <Text id="dashboard.editDashboardDeleteButton" /> <i class="fe fe-trash" />
            </button>
            <button onClick={props.saveDashboard} className="btn btn-outline-primary btn-sm ml-2">
              <Text id="dashboard.editDashboardSaveButton" /> <i class="fe fe-check" />
            </button>
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
