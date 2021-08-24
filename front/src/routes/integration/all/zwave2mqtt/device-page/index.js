import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from '../actions';
import Zwave2mqttPage from '../Zwave2mqttPage';
import DeviceTab from './DeviceTab';

@connect('user,zwave2mqttDevices,housesWithRooms,getZwave2mqttStatus', actions)
class Zwave2mqttIntegration extends Component {
  componentWillMount() {
    this.props.getZwave2mqttDevices();
    this.props.getHouses();
    this.props.getIntegrationByName('zwave2mqtt');
  }

  render(props, {}) {
    return (
      <Zwave2mqttPage user={props.user}>
        <DeviceTab {...props} />
      </Zwave2mqttPage>
    );
  }
}

export default Zwave2mqttIntegration;
