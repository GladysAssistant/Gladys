import { Component } from 'preact';

import SetupLocalOptions from './SetupLocalOptions';
import SetupLocalSummary from './SetupLocalSummary';

class SetupLocalMode extends Component {
  saveConfiguration = configuration => {
    this.props.saveConfiguration(configuration);
    this.setState({ editionMode: false });
  };

  enableEditionMode = () => {
    this.setState({ editionMode: true });
  };

  disableEditionMode = () => {
    this.setState({ editionMode: false });
  };

  constructor(props) {
    super(props);

    const { configuration = {} } = props;

    this.state = {
      editionMode: !configuration.z2mDriverPath
    };
  }

  render({ configuration, httpClient, disabled }, { editionMode }) {
    if (editionMode) {
      return (
        <SetupLocalOptions
          httpClient={httpClient}
          configuration={configuration}
          saveConfiguration={this.saveConfiguration}
          disableEditionMode={this.disableEditionMode}
        />
      );
    }

    return (
      <SetupLocalSummary disabled={disabled} configuration={configuration} enableEditionMode={this.enableEditionMode} />
    );
  }
}

export default SetupLocalMode;
