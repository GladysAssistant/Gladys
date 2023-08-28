import { Component } from 'preact';

import { RequestStatus } from '../../../../../../utils/consts';

import SetupRemoteOptions from './SetupRemoteOptions';
import SetupRemoteSummary from './SetupRemoteSummary';

class SetupRemoteMode extends Component {
  saveConfiguration = configuration => {
    this.props.saveConfiguration(configuration);
  };

  enableEditionMode = () => {
    this.setState({ editionMode: true });
  };

  constructor(props) {
    super(props);

    const { configuration = {} } = props;

    this.state = {
      editionMode: !configuration.mqttMode
    };
  }

  componentWillReceiveProps(nextProps) {
    const { setupZigee2mqttStatus } = nextProps;

    if (setupZigee2mqttStatus === RequestStatus.Success && setupZigee2mqttStatus !== this.props.setupZigee2mqttStatus) {
      this.setState({ editionMode: false });
    }
  }

  render({ configuration, disabled, resetConfiguration }, { editionMode }) {
    if (editionMode) {
      return (
        <SetupRemoteOptions
          disabled={disabled}
          configuration={configuration}
          saveConfiguration={this.saveConfiguration}
          resetConfiguration={resetConfiguration}
        />
      );
    }

    return (
      <SetupRemoteSummary
        disabled={disabled}
        configuration={configuration}
        enableEditionMode={this.enableEditionMode}
      />
    );
  }
}

export default SetupRemoteMode;
