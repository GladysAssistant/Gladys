import { Component, Fragment } from 'preact';

import { RequestStatus } from '../../../../../utils/consts.js';

import { MQTT_MODE, SETUP_MODES } from './constants.js';
import SetupModePanel from './SetupModePanel.jsx';
import SetupLocalMode from './local/SetupLocalMode.jsx';
import SetupRemoteMode from './remote/SetupRemoteMode.jsx';

class SetupPanel extends Component {
  resetSetupMode = () => {
    this.setState({ setupMode: null });
  };

  selectSetupMode = setupMode => {
    this.setState({ setupMode });
  };

  resetConfiguration = () => {
    const { configuration } = this.props;
    this.setState({ configuration });
  };

  saveConfiguration = configuration => {
    this.setState({ configuration });
    this.props.saveConfiguration(configuration);
  };

  constructor(props) {
    super(props);

    const { configuration } = props;

    let setupMode = null;

    if (configuration.mqttMode === MQTT_MODE.LOCAL) {
      setupMode = SETUP_MODES.LOCAL;
    } else if (configuration.mqttMode === MQTT_MODE.EXTERNAL) {
      setupMode = SETUP_MODES.REMOTE;
    }
    this.state = {
      setupMode,
      configuration
    };
  }

  componentWillReceiveProps(nextProps) {
    const { setupZigee2mqttStatus, configuration } = nextProps;

    if (setupZigee2mqttStatus === RequestStatus.Success && setupZigee2mqttStatus !== this.props.setupZigee2mqttStatus) {
      this.setState({ configuration });
    }
  }

  render({ zigbee2mqttStatus = {}, httpClient, disabled, setupZigee2mqttStatus }, { setupMode, configuration }) {
    const { dockerBased, networkModeValid, usbConfigured } = zigbee2mqttStatus;

    return (
      <Fragment>
        <li class="list-group-item">
          <SetupModePanel
            dockerBased={dockerBased}
            networkModeValid={networkModeValid}
            usbConfigured={usbConfigured}
            setupMode={setupMode}
            selectSetupMode={this.selectSetupMode}
            resetSetupMode={this.resetSetupMode}
            disabled={disabled}
          />
        </li>
        {setupMode === SETUP_MODES.LOCAL && (
          <li class="list-group-item">
            <SetupLocalMode
              setupZigee2mqttStatus={setupZigee2mqttStatus}
              configuration={configuration}
              httpClient={httpClient}
              saveConfiguration={this.saveConfiguration}
              resetConfiguration={this.resetConfiguration}
              disabled={disabled}
            />
          </li>
        )}
        {setupMode === SETUP_MODES.REMOTE && (
          <li class="list-group-item">
            <SetupRemoteMode
              setupZigee2mqttStatus={setupZigee2mqttStatus}
              configuration={configuration}
              httpClient={httpClient}
              saveConfiguration={this.saveConfiguration}
              resetConfiguration={this.resetConfiguration}
              disabled={disabled}
            />
          </li>
        )}
      </Fragment>
    );
  }
}

export default SetupPanel;
