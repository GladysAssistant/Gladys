import { Text, MarkupText, Localizer } from 'preact-i18n';
import cx from 'classnames';
import { RequestStatus } from '../../../../../utils/consts';

const SetupTab = ({ children, ...props }) => {
  return (
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">
          <Text id="integration.mqtt.setup.title" />
        </h3>
      </div>
      <div class="card-body">
        <div
          class={cx('dimmer', {
            active: props.connectMqttStatus === RequestStatus.Getting
          })}
        >
          <div class="loader" />
          <div class="dimmer-content">
            <p>
              <MarkupText id="integration.mqtt.setup.mqttDescription" />
            </p>
            {props.connectMqttStatus === RequestStatus.Error && (
              <p class="alert alert-danger">
                <Text id="integration.mqtt.setup.error" />
              </p>
            )}
            {props.connectMqttStatus === RequestStatus.Success && !props.mqttConnected && (
              <p class="alert alert-info">
                <Text id="integration.mqtt.setup.connecting" />
              </p>
            )}
            {props.mqttConnected && (
              <p class="alert alert-success">
                <Text id="integration.mqtt.setup.connected" />
              </p>
            )}
            {props.mqttConnectionError && (
              <p class="alert alert-danger">
                <Text id="integration.mqtt.setup.connectionError" /> - {props.mqttConnectionError}
              </p>
            )}
            <form>
              <div class="form-group">
                <label for="mqttURL" class="form-label">
                  <Text id={`integration.mqtt.setup.urlLabel`} />
                </label>
                <Localizer>
                  <input
                    name="mqttURL"
                    placeholder={<Text id="integration.mqtt.setup.urlPlaceholder" />}
                    value={props.mqttURL}
                    class="form-control"
                    onInput={props.updateConfigration}
                  />
                </Localizer>
              </div>

              <div class="form-group">
                <label for="mqttUsername" class="form-label">
                  <Text id={`integration.mqtt.setup.userLabel`} />
                </label>
                <Localizer>
                  <input
                    name="mqttUsername"
                    placeholder={<Text id="integration.mqtt.setup.userPlaceholder" />}
                    value={props.mqttUsername}
                    class="form-control"
                    onInput={props.updateConfigration}
                  />
                </Localizer>
              </div>

              <div class="form-group">
                <label for="mqttPassword" class="form-label">
                  <Text id={`integration.mqtt.setup.passwordLabel`} />
                </label>
                <Localizer>
                  <input
                    name="mqttPassword"
                    type="password"
                    placeholder={<Text id="integration.mqtt.setup.passwordPlaceholder" />}
                    value={props.mqttPassword}
                    class="form-control"
                    onInput={props.updateConfigration}
                  />
                </Localizer>
              </div>

              <div class="row mt-5">
                <div class="col">
                  <button type="submit" class="btn btn-success" onClick={props.saveConfiguration}>
                    <Text id="integration.mqtt.setup.saveLabel" />
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
