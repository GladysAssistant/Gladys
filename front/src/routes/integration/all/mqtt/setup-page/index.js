import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import MqttPage from '../MqttPage';
import SetupTab from './SetupTab';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../../server/utils/constants';

class MqttNodePage extends Component {
  componentWillMount() {
    this.props.getIntegrationByName('mqtt');
    this.props.loadProps();
    this.props.loadStatus();
    this.props.session.dispatcher.addListener(
      WEBSOCKET_MESSAGE_TYPES.MQTT.CONNECTED,
      this.props.displayConnectedMessage
    );
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.MQTT.ERROR, this.props.displayMqttError);
  }

  componentWillUnmount() {
    this.props.session.dispatcher.removeListener(
      WEBSOCKET_MESSAGE_TYPES.MQTT.CONNECTED,
      this.props.displayConnectedMessage
    );
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.MQTT.ERROR, this.props.displayMqttError);
  }

  render(props, {}) {
    return (
      <MqttPage>
        <SetupTab {...props} />
      </MqttPage>
    );
  }
}

export default connect(
  'user,session,httpClient,mqttUrl,mqttUsername,mqttPassword,useEmbeddedBroker,brokerContainerAvailable,dockerBased,networkModeValid,connectMqttStatus,mqttConnected,mqttConnectionError',
  actions
)(MqttNodePage);
