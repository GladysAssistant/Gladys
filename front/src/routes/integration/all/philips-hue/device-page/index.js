import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import PhilipsHuePage from '../PhilipsHuePage';
import DevicePage from './DevicePage';
import FoundDevices from './FoundDevices';

@connect(
  'session,user,philipsHueDevices,houses,getPhilipsHueDevicesStatus,philipsHueNewDevices,getPhilipsHueCreateDeviceStatus,getPhilipsHueNewDevicesStatus',
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
        {props.philipsHueDevices && props.philipsHueDevices.length ? <DevicePage {...props} /> : <div />}
        <FoundDevices {...props} />
      </PhilipsHuePage>
    );
  }
}

export default PhilipsHueDevicePage;
