import { Component } from 'preact';

import { RequestStatus } from '../../../../../../utils/consts';

import SetupLocalOptions from './SetupLocalOptions';
import SetupLocalSummary from './SetupLocalSummary';

class SetupLocalMode extends Component {
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
      editionMode: !configuration.z2mDriverPath
    };
  }

  componentWillReceiveProps(nextProps) {
    const { setupZigee2mqttStatus } = nextProps;

    if (setupZigee2mqttStatus === RequestStatus.Success && setupZigee2mqttStatus !== this.props.setupZigee2mqttStatus) {
      this.setState({ editionMode: false });
    }
  }

  render({ configuration, httpClient, disabled, resetConfiguration }, { editionMode }) {
    if (editionMode) {
      return (
        <SetupLocalOptions
          disabled={disabled}
          httpClient={httpClient}
          configuration={configuration}
          saveConfiguration={this.saveConfiguration}
          resetConfiguration={resetConfiguration}
        />
      );
    }

    return (
      <SetupLocalSummary disabled={disabled} configuration={configuration} enableEditionMode={this.enableEditionMode} />
    );
  }
}

export default SetupLocalMode;
