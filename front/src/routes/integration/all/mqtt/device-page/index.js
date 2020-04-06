import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import MqttPage from '../MqttPage';
import DeviceTab from './DeviceTab';

@connect('session,user,mqttDevices,houses,getMqttDevicesStatus', actions)
class MqttDevicePage extends Component {
  componentWillMount() {
    this.props.getMqttDevices();
    this.props.getHouses();
    this.props.getIntegrationByName('mqtt');
  }

  render(props, {}) {
    return (
      <MqttPage>
        <DeviceTab {...props} />
      </MqttPage>
    );
  }
}

export default MqttDevicePage;
