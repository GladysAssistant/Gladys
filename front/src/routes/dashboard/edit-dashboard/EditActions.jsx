import { Text, Localizer } from 'preact-i18n';

const EditActions = props => (
  <div class="fixed-bottom footer">
    <div class="container">
      <div class="row align-items-center flex-row-reverse flex-wrap">
        {!props.askDeleteDashboard && (
          <div class="col-auto">
            <Localizer>
              <button
                onClick={props.cancelDashboardEdit}
                className="btn btn-outline-secondary btn-sm ml-2"
                aria-label={<Text id="dashboard.editDashboardCancelButton" />}
              >
                <span class="d-none d-md-inline-block">
                  <Text id="dashboard.editDashboardCancelButton" />
                </span>{' '}
                <i class="fe fe-slash" aria-hidden="true" />
              </button>
            </Localizer>
            <Localizer>
              <button
                onClick={props.askDeleteCurrentDashboard}
                className="btn btn-outline-danger btn-sm ml-2"
                aria-label={<Text id="dashboard.editDashboardDeleteButton" />}
              >
                <span class="d-none d-md-inline-block">
                  <Text id="dashboard.editDashboardDeleteButton" />
                </span>{' '}
                <i class="fe fe-trash" aria-hidden="true" />
              </button>
            </Localizer>
            <Localizer>
              <button
                onClick={props.duplicateCurrentDashboard}
                className="btn btn-outline-secondary btn-sm ml-2"
                aria-label={<Text id="dashboard.editDashboardDuplicateButton" />}
              >
                <span class="d-none d-md-inline-block">
                  <Text id="dashboard.editDashboardDuplicateButton" />
                </span>{' '}
                <i class="fe fe-copy" aria-hidden="true" />
              </button>
            </Localizer>
            <Localizer>
              <button
                onClick={props.saveDashboard}
                className="btn btn-outline-primary btn-sm ml-2"
                aria-label={<Text id="dashboard.editDashboardSaveButton" />}
              >
                <span class="d-none d-md-inline-block">
                  <Text id="dashboard.editDashboardSaveButton" />
                </span>{' '}
                <i class="fe fe-check" aria-hidden="true" />
              </button>
            </Localizer>
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
