import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';
import { RequestStatus } from '../../../../../utils/consts';
import DeviceConfigurationLink from '../../../../../components/documentation/DeviceConfigurationLink';

const CloudSetupTab = props => {
  return (
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">
          <Text id="integration.google-actions.setup.cloud.title" />
        </h3>
      </div>
      <div class="card-body">
        <div class="alert alert-info">
          <DeviceConfigurationLink {...props} documentKey="google-actions-configuration">
            <Text id="integration.google-actions.setup.cloud.documentationLink" />
          </DeviceConfigurationLink>
        </div>

        <div
          class={cx('dimmer', {
            active:
              props.configureGoogleActionsStatus === RequestStatus.Getting ||
              props.loadGoogleActionsStatus === RequestStatus.Getting
          })}
        >
          <div class="loader" />
          <div class="dimmer-content">
            <div>
              {props.googleActionsConfigurationError && (
                <p class="alert alert-danger">
                  <Text id="integration.google-actions.setup.cloud.invalidFile" />
                </p>
              )}
              {props.configureGoogleActionsStatus === RequestStatus.Error && (
                <p class="alert alert-danger">
                  <Text id="integration.google-actions.setup.cloud.error" />
                </p>
              )}
              {props.configureGoogleActionsStatus === RequestStatus.Success && (
                <p class="alert alert-success">
                  <Text id="integration.google-actions.setup.cloud.saved" />
                </p>
              )}
              <form>
                <div class="form-group">
                  <label for="googleActionsProjectKey" class="form-label">
                    <Text id={`integration.google-actions.setup.cloud.projectKey`} />
                  </label>
                  <Localizer>
                    <input
                      id="googleActionsProjectKey"
                      name="googleActionsProjectKey"
                      placeholder={<Text id="integration.google-actions.setup.cloud.projectKey" />}
                      value={props.googleActionsProjectKey}
                      class="form-control"
                      onInput={props.updateConfigration}
                    />
                  </Localizer>
                </div>
                <div class="form-group">
                  <label for="googleActionsProjectFile" class="form-label">
                    <Text id={`integration.google-actions.setup.cloud.projectFile`} />
                  </label>
                  <div class="custom-file">
                    <input
                      type="file"
                      class="custom-file-input"
                      onChange={props.updateConfigrationFile}
                      value={props.fileGoogleActionsValue}
                      accept=".json"
                    />
                    <label class="custom-file-label">
                      <Text id="integration.google-actions.setup.cloud.projectFileButton" />
                    </label>
                  </div>
                </div>

                <div class="row mt-5">
                  <div class="col">
                    <button
                      type="submit"
                      class="btn btn-success"
                      onClick={props.saveConfiguration}
                      disabled={!props.fileGoogleActionsValue || !props.googleActionsProjectKey}
                    >
                      <Text id="integration.google-actions.setup.cloud.saveLabel" />
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CloudSetupTab;
