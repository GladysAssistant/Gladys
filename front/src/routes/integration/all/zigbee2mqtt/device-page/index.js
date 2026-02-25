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
    this.props.getZ2mUrl();
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
  'user,session,zigbee2mqttDevices,houses,getZigbee2mqttStatus,zigbee2mqttSearch,getZigbee2mqttOrderDir,z2mUrl',
  actions
)(Zigbee2mqttIntegration);
