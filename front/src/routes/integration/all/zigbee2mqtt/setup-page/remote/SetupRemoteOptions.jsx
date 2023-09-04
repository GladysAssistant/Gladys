import { Component } from 'preact';
import { MarkupText, Text, Localizer } from 'preact-i18n';
import { MQTT_MODE } from '../constants';
import cx from 'classnames';

import SubmitConfiguration from '../components/SubmitConfiguration';

class SetupRemoteOptions extends Component {
  selectGladysMQTT = () => {
    this.setState({
      mqttMode: MQTT_MODE.GLADYS
    });
  };

  selectExternalMQTT = () => {
    this.setState({
      mqttMode: MQTT_MODE.EXTERNAL
    });
  };

  updateMqttUrl = e => {
    this.setState({ mqttUrl: e.target.value });
  };

  updateMqttUsername = e => {
    this.setState({ mqttUsername: e.target.value });
  };

  updateMqttPassword = e => {
    this.setState({ mqttPassword: e.target.value });
  };

  saveConfiguration = () => {
    const { mqttMode, mqttUrl, mqttUsername, mqttPassword } = this.state;
    this.props.saveConfiguration({
      mqttMode,
      mqttUrl,
      mqttUsername,
      mqttPassword
    });
  };

  resetConfiguration = () => {
    const { configuration } = this.props;
    const { mqttMode } = configuration;

    this.setState({ mqttMode });
    this.props.resetConfiguration();
  };

  constructor(props) {
    super(props);

    const { configuration } = props;
    const { mqttMode, mqttUrl, mqttPassword, mqttUsername } = configuration;

    this.state = {
      mqttMode,
      mqttUrl,
      mqttPassword,
      mqttUsername,
      showPassword: false
    };
  }

  render({ disabled }, { mqttMode, mqttUrl, mqttUsername, mqttPassword, showPassword }) {
    return (
      <div>
        <p>
          <Text id="integration.zigbee2mqtt.setup.modes.remote.detailsDescription" />
        </p>
        <div class="form-group">
          <label class="form-label">
            <Text id="integration.zigbee2mqtt.setup.modes.remote.mqttModeLabel" />
          </label>
        </div>
        <div class="d-flex mb-4">
          <div class="btn-group mx-auto">
            <button
              class={cx('btn', 'btn-light', { active: mqttMode === MQTT_MODE.GLADYS })}
              onClick={this.selectGladysMQTT}
              disabled={disabled}
              data-cy="z2m-setup-remote-gladys-mqtt-mode"
            >
              <Text id="integration.zigbee2mqtt.setup.modes.remote.gladys.modeLabel" />
            </button>
            <button
              class={cx('btn', 'btn-light', { active: mqttMode === MQTT_MODE.EXTERNAL })}
              onClick={this.selectExternalMQTT}
              disabled={disabled}
              data-cy="z2m-setup-remote-external-mqtt-mode"
            >
              <Text id="integration.zigbee2mqtt.setup.modes.remote.external.modeLabel" />
            </button>
          </div>
        </div>
        <div class="form-group">
          {mqttMode === MQTT_MODE.GLADYS && (
            <div class="alert alert-info">
              <MarkupText
                id="integration.zigbee2mqtt.setup.modes.remote.gladys.modeDescription"
                data-cy="z2m-setup-remote-gladys-mqtt-description"
              />
            </div>
          )}
          {mqttMode === MQTT_MODE.EXTERNAL && (
            <form>
              <div class="form-group">
                <label for="mqttUrl" class="form-label">
                  <Text id={`integration.mqtt.setup.urlLabel`} />
                </label>
                <Localizer>
                  <input
                    id="mqttUrl"
                    name="mqttUrl"
                    placeholder={<Text id="integration.mqtt.setup.urlPlaceholder" />}
                    value={mqttUrl}
                    class="form-control"
                    onInput={this.updateMqttUrl}
                  />
                </Localizer>
              </div>

              <div class="form-group">
                <label for="mqttUsername" class="form-label">
                  <Text id={`integration.mqtt.setup.userLabel`} />
                </label>
                <Localizer>
                  <input
                    id="mqttUsername"
                    name="mqttUsername"
                    placeholder={<Text id="integration.mqtt.setup.userPlaceholder" />}
                    value={mqttUsername}
                    class="form-control"
                    onInput={this.updateMqttUsername}
                    autoComplete="no"
                  />
                </Localizer>
              </div>

              <div class="form-group">
                <label for="mqttPassword" class="form-label">
                  <Text id={`integration.mqtt.setup.passwordLabel`} />
                </label>
                <div class="input-icon mb-3">
                  <Localizer>
                    <input
                      id="mqttPassword"
                      name="mqttPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder={<Text id="integration.mqtt.setup.passwordPlaceholder" />}
                      value={mqttPassword}
                      class="form-control"
                      onInput={this.updateMqttPassword}
                      autoComplete="new-password"
                    />
                  </Localizer>
                  <span class="input-icon-addon cursor-pointer" onClick={this.togglePassword}>
                    <i
                      class={cx('fe', {
                        'fe-eye': !showPassword,
                        'fe-eye-off': showPassword
                      })}
                    />
                  </span>
                </div>
              </div>
            </form>
          )}
        </div>
        <SubmitConfiguration
          disabled={disabled}
          saveConfiguration={this.saveConfiguration}
          resetConfiguration={this.resetConfiguration}
        />
      </div>
    );
  }
}

export default SetupRemoteOptions;
