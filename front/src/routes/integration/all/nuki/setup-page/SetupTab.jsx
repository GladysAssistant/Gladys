import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';

import { RequestStatus } from '../../../../../utils/consts';

const SetupTab = ({ children, ...props }) => {
  return (
    <div class="card">
      <div class="card-header">
        <h1 class="card-title">
          <Text id="integration.nuki.setup.title" />
        </h1>
      </div>
      <div class="card-body">
        <div
          class={cx('dimmer', {
            active: props.nukiConnectionStatus === RequestStatus.Getting
          })}
        >
          <div class="loader" />
          <div class="dimmer-content">
            <p>
              <Text id="integration.nuki.setup.nukiDescription" />
            </p>
            {props.nukiConnectionsStatus === RequestStatus.Error && !props.nukiConnectionError && (
              <p class="alert alert-danger">
                <Text id="integration.nuki.setup.error" />
              </p>
            )}
            {props.nukiConnectionStatus === RequestStatus.Success && !props.nukiConnected && (
              <p class="alert alert-info">
                <Text id="integration.nuki.setup.connecting" />
              </p>
            )}
            {props.nukiConnected && (
              <p class="alert alert-success">
                <Text id="integration.nuki.setup.connected" />
              </p>
            )}
            {props.nukiConnectionError && (
              <p class="alert alert-danger">
                <Text id="integration.nuki.setup.connectionError" />
              </p>
            )}

            <form id="nukiSetupForm">
                       
              <div class="form-group">
                <label for="nukiUsername" class="form-label">
                  <Text id={`integration.nuki.setup.userLabel`} />
                </label>
                <Localizer>
                  <input
                    name="nukiUsername"
                    placeholder={<Text id="integration.nuki.setup.userPlaceholder" />}
                    value={props.nukiUsername}
                    class="form-control"
                    onInput={props.updateConfiguration}
                  />
                </Localizer>
              </div>

              <div class="form-group">
                <label for="nukiPassword" class="form-label">
                  <Text id={`integration.nuki.setup.passwordLabel`} />
                </label>
                <Localizer>
                  <input
                    name="nukiPassword"
                    type="password"
                    placeholder={<Text id="integration.nuki.setup.passwordPlaceholder" />}
                    value={props.nukiPassword}
                    class="form-control"
                    onInput={props.updateConfiguration}
                  />
                </Localizer>
              </div>

              <div class="row mt-5">
                <div class="col">
                  <button type="submit" class="btn btn-success" onClick={props.saveConfiguration}>
                    <Text id="integration.nuki.setup.saveLabel" />
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

export default SetupTab;