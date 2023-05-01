import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import Zigbee2mqttPage from '../Zigbee2mqttPage';
import DeviceTab from './DeviceTab';

class Zigbee2mqttIntegration extends Component {
  componentWillMount() {
    this.props.getZigbee2mqttDevices(100, 0);
    this.props.getHouses();
    this.props.getIntegrationByName('zigbee2mqtt');
  }

  render(props, {}) {
    return (
      <Zigbee2mqttPage user={props.user}>
        <DeviceTab {...props} />
      </Zigbee2mqttPage>
    );
  }
}

export default connect(
  'user,zigbee2mqttDevices,houses,getZigbee2mqttStatus,zigbee2mqttSearch,getZigbee2mqttOrderDir',
  actions
)(Zigbee2mqttIntegration);
