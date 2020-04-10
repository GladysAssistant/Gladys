import { Component } from 'preact';
import { connect } from 'unistore/preact';
//import docker_actions from '../../../../../actions/docker';
import actions from './actions';
import Zigbee2mqttPage from '../Zigbee2mqttPage';
import SetupTab from './SetupTab';
//import integrationConfig from '../../../../../config/integrations';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../../server/utils/constants';

@connect(
  'user,session,z2mEnabled,dockerContainers,z2mContainerExists,mqtt4z2mContainerExists,zigbee2mqttContainerStatus,connectMqttStatus,mqttConnected,mqttConnectionError',
  actions
)
class Zigbee2mqttNodePage extends Component {
  componentWillMount() {
    //    this.props.getIntegrationByName('zigbee2mqtt');
    this.props.getContainers();

    //this.props.startContainer();
    //this.props.getZigbee2qttContainerID();

//    this.props.loadProps();

    /*    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.MQTT.CONNECTED, () =>
      this.props.displayConnectedMessage()
    );
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.MQTT.ERROR, payload =>
      this.props.displayMqttError(payload)
    );
 */
  }

  render(props, {}) {
    return (
      <Zigbee2mqttPage user={props.user}>
        <SetupTab {...props} />
      </Zigbee2mqttPage>
    );
  }
}

export default Zigbee2mqttNodePage;
