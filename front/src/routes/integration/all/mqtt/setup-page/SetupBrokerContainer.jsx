import { Component } from 'preact';
import { Text, MarkupText } from 'preact-i18n';
import { RequestStatus } from '../../../../../utils/consts';

class SetupBrokerContainer extends Component {
  installContainer = async () => {
    this.setState({ installing: RequestStatus.Getting });
    try {
      await this.props.httpClient.post('/api/v1/service/mqtt/config/docker');
      await this.props.loadProps();
      this.props.updateConfiguration({ useEmbeddedBroker: true });
      this.setState({ installing: RequestStatus.Success });
    } catch (e) {
      this.setState({ installing: RequestStatus.Error });
    }
  };

  render({}, { installing }) {
    return (
      <div>
        <div class="alert alert-info">
          <MarkupText id="integration.mqtt.setup.brokerDockerNotInstalled" />
        </div>
        {installing === RequestStatus.Error && (
          <div class="alert alert-danger">
            <MarkupText id="integration.mqtt.setup.installBrokerError" />
          </div>
        )}
        <div class="form-group">
          {installing !== RequestStatus.Getting && (
            <button type="button" class="btn btn-primary" onClick={this.installContainer}>
              <Text id="integration.mqtt.setup.installBrokerButton" />
            </button>
          )}
          {installing === RequestStatus.Getting && (
            <button type="button" class="btn btn-primary btn-loading" disabled>
              <Text id="integration.mqtt.setup.installingBrokerButton" />
            </button>
          )}
        </div>
      </div>
    );
  }
}

export default SetupBrokerContainer;
