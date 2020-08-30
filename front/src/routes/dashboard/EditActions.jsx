import { Text } from 'preact-i18n';

const EditActions = props => (
  <div class="fixed-bottom footer">
    <div class="container">
      <div class="row align-items-center flex-row-reverse">
        <div class="col-auto">
          <button onClick={props.cancelDashboardEdit} class="btn btn-outline-danger btn-sm ml-2">
            <Text id="dashboard.editDashboardCancelButton" /> <i class="fe fe-slash" />
          </button>
          <button onClick={props.saveDashboard} class="btn btn-outline-primary btn-sm ml-2">
            <Text id="dashboard.editDashboardSaveButton" /> <i class="fe fe-check" />
          </button>
        </div>
      </div>
    </div>
  </div>
);

export default EditActions;
