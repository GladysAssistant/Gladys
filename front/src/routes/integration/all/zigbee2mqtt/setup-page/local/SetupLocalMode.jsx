import { Component } from 'preact';

import { RequestStatus } from '../../../../../../utils/consts';
import { ADAPTER_MODE } from '../constants';

import SetupLocalOptions from './SetupLocalOptions';
import SetupLocalSummary from './SetupLocalSummary';

class SetupLocalMode extends Component {
  saveConfiguration = configuration => {
    this.props.saveConfiguration(configuration);
  };

  disableEditionMode = () => {
    this.setState({ editionMode: false });
  };

  resetConfiguration = () => {
    this.props.resetConfiguration();
    this.disableEditionMode();
  };

  enableEditionMode = () => {
    this.setState({ editionMode: true });
  };

  constructor(props) {
    super(props);

    const { configuration = {} } = props;

    const coordinatorConfigured =
      configuration.z2mAdapterMode === ADAPTER_MODE.NETWORK
        ? Boolean(configuration.z2mNetworkAdapterUrl)
        : Boolean(configuration.z2mDriverPath);

    this.state = {
      editionMode: !coordinatorConfigured
    };
  }

  componentWillReceiveProps(nextProps) {
    const { setupZigee2mqttStatus } = nextProps;

    if (setupZigee2mqttStatus === RequestStatus.Success && setupZigee2mqttStatus !== this.props.setupZigee2mqttStatus) {
      this.setState({ editionMode: false });
    }
  }

  render({ configuration, httpClient, disabled, zigbee2mqttStatus }, { editionMode }) {
    if (editionMode) {
      return (
        <SetupLocalOptions
          disabled={disabled}
          httpClient={httpClient}
          configuration={configuration}
          saveConfiguration={this.saveConfiguration}
          resetConfiguration={this.resetConfiguration}
          zigbee2mqttStatus={zigbee2mqttStatus}
        />
      );
    }

    return (
      <SetupLocalSummary
        disabled={disabled}
        configuration={configuration}
        enableEditionMode={this.enableEditionMode}
        zigbee2mqttStatus={zigbee2mqttStatus}
      />
    );
  }
}

export default SetupLocalMode;
