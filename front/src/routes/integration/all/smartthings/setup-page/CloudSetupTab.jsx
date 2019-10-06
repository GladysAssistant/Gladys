import { Text, MarkupText, Localizer } from 'preact-i18n';
import cx from 'classnames';
import { RequestStatus } from '../../../../../utils/consts';

const CloudSetupTab = ({ children, ...props }) => {
  return (
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">
          <Text id="integration.smartthings.setup.cloud.title" />
        </h3>
      </div>
      <div class="card-body">
        <div class="alert alert-info">
          <MarkupText id="integration.smartthings.setup.cloud.description" />
        </div>

        <div
          class={cx('dimmer', {
            active: props.configureSmartthingsStatus === RequestStatus.Getting
          })}
        >
          <div class="loader" />
          <div class="dimmer-content">
            {props.configureSmartthingsStatus === RequestStatus.Error && (
              <p class="alert alert-danger">
                <Text id="integration.smartthings.setup.cloud.error" />
              </p>
            )}
            {props.configureSmartthingsStatus === RequestStatus.Success && (
              <p class="alert alert-info">
                <Text id="integration.smartthings.setup.cloud.saved" />
              </p>
            )}
            <form>
              <div class="form-group">
                <label for="smartthingsClientId" class="form-label">
                  <Text id={`integration.smartthings.setup.cloud.clientId`} />
                </label>
                <Localizer>
                  <input
                    name="smartthingsClientId"
                    placeholder={<Text id="integration.smartthings.setup.cloud.clientId" />}
                    value={props.smartthingsClientId}
                    class="form-control"
                    onInput={props.updateConfigration}
                  />
                </Localizer>
              </div>

              <div class="form-group">
                <label for="smartthingsClientSecret" class="form-label">
                  <Text id={`integration.smartthings.setup.cloud.clientSecret`} />
                </label>
                <Localizer>
                  <input
                    name="smartthingsClientSecret"
                    placeholder={<Text id="integration.smartthings.setup.cloud.clientSecret" />}
                    value={props.smartthingsClientSecret}
                    class="form-control"
                    onInput={props.updateConfigration}
                  />
                </Localizer>
              </div>

              <div class="row mt-5">
                <div class="col">
                  <button type="submit" class="btn btn-success" onClick={props.saveConfiguration}>
                    <Text id="integration.smartthings.setup.cloud.saveLabel" />
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CloudSetupTab;
