import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import Zigbee2mqttPage from '../Zigbee2mqttPage';
import DiscoverTab from './DiscoverTab';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../../server/utils/constants';

@connect(
  'user,session,housesWithRooms,zigbee2mqttDevices,discoverZigbee2mqtt,discoverZigbee2mqttError',
  actions
)
class Zigbee2mqttIntegration extends Component {
  componentWillMount() {
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.DISCOVER, payload => {
      this.props.setDiscoveredDevices(payload);
    });

    this.props.getHouses();
    this.props.getIntegrationByName('zigbee2mqtt');
  }

  render(props, {}) {
    return (
      <Zigbee2mqttPage user={props.user}>
        <DiscoverTab {...props} />
      </Zigbee2mqttPage>
    );
  }
}

export default Zigbee2mqttIntegration;
