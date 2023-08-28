import { Component } from 'preact';
import { MarkupText, Text } from 'preact-i18n';
import cx from 'classnames';

import SubmitConfiguration from '../components/SubmitConfiguration';

const MQTT_MODE = {
  GLADYS: 'gladys',
  EXTERNAL: 'external'
};

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

  saveConfiguration = () => {
    const { mqttMode } = this.state;
    this.props.saveConfiguration({ mqttMode });
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
    const { mqttMode } = configuration;

    this.state = {
      mqttMode
    };
  }

  render({ disabled }, { mqttMode }) {
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
              disabled={true}
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
