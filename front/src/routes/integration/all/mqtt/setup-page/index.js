import { Component } from 'preact';
import { connect } from 'unistore/preact';
import integrationsActions from '../../../../../actions/integration';
import MqttPage from '../MqttPage';
import SetupTab from './SetupTab';
import { RequestStatus } from '../../../../../utils/consts';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../../server/utils/constants';

class MqttNodePage extends Component {
  loadStatus = async () => {
    try {
      const mqttStatus = await this.props.httpClient.get('/api/v1/service/mqtt/status');
      this.setState({
        mqttConnected: mqttStatus.connected
      });
    } catch (e) {
      this.setState({
        mqttConnectionError: RequestStatus.NetworkError
      });
      console.error(e);
    }
  };

  loadProps = async () => {
    let configuration = {};
    try {
      configuration = await this.props.httpClient.get('/api/v1/service/mqtt/config');
    } catch (e) {
      console.error(e);
    } finally {
      this.setState({
        mqttUrl: configuration.mqttUrl,
        mqttUsername: configuration.mqttUsername,
        mqttPassword: configuration.mqttPassword,
        useEmbeddedBroker: configuration.useEmbeddedBroker,
        dockerBased: configuration.dockerBased,
        networkModeValid: configuration.networkModeValid,
        brokerContainerAvailable: configuration.brokerContainerAvailable,
        passwordChanges: false
      });
    }
  };

  updateConfiguration = config => {
    this.setState(config);
  };

  saveConfiguration = async () => {
    this.setState({
      connectMqttStatus: RequestStatus.Getting,
      mqttConnected: false,
      mqttConnectionError: undefined
    });
    try {
      const { mqttUrl, mqttUsername, mqttPassword, useEmbeddedBroker } = this.state;
      await this.props.httpClient.post(`/api/v1/service/mqtt/connect`, {
        mqttUrl,
        mqttUsername,
        mqttPassword,
        useEmbeddedBroker
      });

      this.setState({
        connectMqttStatus: RequestStatus.Success
      });
    } catch (e) {
      console.error(e);
      this.setState({
        connectMqttStatus: RequestStatus.Error,
        passwordChanges: false
      });
    }
  };

  displayConnectedMessage = () => {
    // display 3 seconds a message "MQTT connected"
    this.setState({
      mqttConnected: true,
      connectMqttStatus: undefined,
      mqttConnectionError: undefined
    });
  };

  displayMqttError = error => {
    this.setState({
      mqttConnected: false,
      connectMqttStatus: undefined,
      mqttConnectionError: error
    });
  };

  componentWillMount() {
    // this.props.getIntegrationByName('mqtt');
    this.loadStatus();
    this.loadProps();
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.MQTT.CONNECTED, this.displayConnectedMessage);
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.MQTT.ERROR, this.displayMqttError);
  }

  componentWillUnmount() {
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.MQTT.CONNECTED, this.displayConnectedMessage);
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.MQTT.ERROR, this.displayMqttError);
  }

  render(props, state) {
    return (
      <MqttPage>
        <SetupTab
          {...props}
          {...state}
          loadStatus={this.loadStatus}
          loadProps={this.loadProps}
          updateConfiguration={this.updateConfiguration}
          saveConfiguration={this.saveConfiguration}
        />
      </MqttPage>
    );
  }
}

export default connect('user,session,httpClient', integrationsActions)(MqttNodePage);
