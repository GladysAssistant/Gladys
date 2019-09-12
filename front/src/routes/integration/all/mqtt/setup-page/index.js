import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import MqttPage from '../MqttPage';
import SetupTab from './SetupTab';
import integrationConfig from '../../../../../config/integrations';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../../server/utils/constants';

@connect(
  'user,session,mqttURL,mqttUsername,mqttPassword,connectMqttStatus,mqttConnected,mqttConnectionError',
  actions
)
class MqttNodePage extends Component {
  componentWillMount() {
    this.props.getIntegrationByName('mqtt');
    this.props.loadProps();
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.MQTT.CONNECTED, () =>
      this.props.displayConnectedMessage()
    );
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.MQTT.ERROR, payload =>
      this.props.displayMqttError(payload)
    );
  }

  render(props, {}) {
    return (
      <MqttPage integration={integrationConfig[props.user.language].mqtt}>
        <SetupTab {...props} />
      </MqttPage>
    );
  }
}

export default MqttNodePage;
