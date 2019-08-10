import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import Zigbee2mqttPage from './Zigbee2mqttPage';

@connect(
  'user,zigbee2mqttDevices,housesWithRooms,getZigbee2mqttStatus',
  actions
)
class Zigbee2mqttIntegration extends Component {
  componentWillMount() {
    this.props.getZigbee2mqttDevices(100, 0);
    this.props.getHouses();
    this.props.getIntegrationByName('mqtt');
  }

  render(props, {}) {
    return <Zigbee2mqttPage {...props} />;
  }
}

export default Zigbee2mqttIntegration;
