import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';

import { RequestStatus } from '../../../../../utils/consts';

const SetupTab = ({ children, ...props }) => {
  return (
    <div class="card">
      <div class="card-header">
        <h1 class="card-title">
          <Text id="integration.overkiz.setup.title" />
        </h1>
      </div>
      <div class="card-body">
        <div
          class={cx('dimmer', {
            active: props.connectOverkizStatus === RequestStatus.Getting
          })}
        >
          <div class="loader" />
          <div class="dimmer-content">
            <p>
              <Text id="integration.overkiz.setup.overkizDescription" />
            </p>
            {props.connectOverkizStatus === RequestStatus.Error && !props.overkizConnectionError && (
              <p class="alert alert-danger">
                <Text id="integration.overkiz.setup.error" />
              </p>
            )}
            {props.connectOverkizStatus === RequestStatus.Success && !props.overkizConnected && (
              <p class="alert alert-info">
                <Text id="integration.overkiz.setup.connecting" />
              </p>
            )}
            {props.overkizConnected && (
              <p class="alert alert-success">
                <Text id="integration.overkiz.setup.connected" />
              </p>
            )}
            {props.overkizConnectionError && (
              <p class="alert alert-danger">
                <Text id="integration.overkiz.setup.connectionError" />
              </p>
            )}

            <form>
              <div class="form-group">
                <label for="overkizUsername" class="form-label">
                  <Text id={`integration.overkiz.setup.userLabel`} />
                </label>
                <Localizer>
                  <input
                    name="overkizUsername"
                    placeholder={<Text id="integration.overkiz.setup.userPlaceholder" />}
                    value={props.overkizUsername}
                    class="form-control"
                    onInput={props.updateConfigration}
                  />
                </Localizer>
              </div>

              <div class="form-group">
                <label for="overkizPassword" class="form-label">
                  <Text id={`integration.overkiz.setup.passwordLabel`} />
                </label>
                <Localizer>
                  <input
                    name="overkizPassword"
                    type="password"
                    placeholder={<Text id="integration.overkiz.setup.passwordPlaceholder" />}
                    value={props.overkizPassword}
                    class="form-control"
                    onInput={props.updateConfigration}
                  />
                </Localizer>
              </div>

              <div class="row mt-5">
                <div class="col">
                  <button type="submit" class="btn btn-success" onClick={props.saveConfiguration}>
                    <Text id="integration.overkiz.setup.saveLabel" />
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
