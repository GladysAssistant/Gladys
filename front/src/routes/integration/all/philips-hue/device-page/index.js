import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import PhilipsHuePage from '../PhilipsHuePage';
import DevicePage from './DevicePage';
import FoundDevices from './FoundDevices';

class PhilipsHueDevicePage extends Component {
  componentWillMount() {
    this.props.getPhilipsHueDevices();
    this.props.getHouses();
    this.props.getPhilipsHueNewDevices();
    this.props.getIntegrationByName('philips-hue');
  }

  render(props, {}) {
    return (
      <PhilipsHuePage user={props.user}>
        {props.philipsHueDevices && props.philipsHueDevices.length ? <DevicePage {...props} /> : <div />}
        <FoundDevices {...props} />
      </PhilipsHuePage>
    );
  }
}

export default connect(
  'session,user,philipsHueDevices,houses,getPhilipsHueDevicesStatus,philipsHueNewDevices,getPhilipsHueCreateDeviceStatus,getPhilipsHueNewDevicesStatus,philipsHueDeviceSearch,getPhilipsHueDeviceOrderDir',
  actions
)(PhilipsHueDevicePage);
