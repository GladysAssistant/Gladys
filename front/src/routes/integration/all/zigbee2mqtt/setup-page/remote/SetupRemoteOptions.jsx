import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import { MQTT_MODE } from '../constants';
import cx from 'classnames';

import SubmitConfiguration from '../components/SubmitConfiguration';

class SetupRemoteOptions extends Component {
  togglePassword = () => {
    this.setState(prevState => ({ showPassword: !prevState.showPassword }));
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
    const { mqttUrl, mqttPassword, mqttUsername } = configuration;

    this.state = {
      mqttMode: MQTT_MODE.EXTERNAL,
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
                    data-cy="z2m-setup-remote-broker-url-field"
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
                    data-cy="z2m-setup-remote-broker-username-field"
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
                      data-cy="z2m-setup-remote-broker-password-field"
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
