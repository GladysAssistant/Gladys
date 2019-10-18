import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import PhilipsHuePage from '../PhilipsHuePage';
import DevicePage from './DevicePage';
import FoundDevices from './FoundDevices';

@connect(
  'session,user,philipsHueDevices,houses,getPhilipsHueDevicesStatus,philipsHueNewDevices,getPhilipsHueCreateDeviceStatus',
  actions
)
class PhilipsHueDevicePage extends Component {
  componentWillMount() {
    this.props.getPhilipsHueDevices();
    this.props.getHouses();
    this.props.getPhilipsHueNewDevices();
    this.props.getIntegrationByName('philips-hue');
  }

  render(props, {}) {
    return (
      <PhilipsHuePage>
        <DevicePage {...props} />
        <FoundDevices {...props} />
      </PhilipsHuePage>
    );
  }
}

export default PhilipsHueDevicePage;
