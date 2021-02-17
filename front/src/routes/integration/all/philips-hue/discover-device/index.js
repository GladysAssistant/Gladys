import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import PhilipsHuePage from '../PhilipsHuePage';
import FoundDevices from './FoundDevices';

@connect(
  'session,user,philipsHueDevices,houses,getPhilipsHueDevicesStatus,philipsHueNewDevices,getPhilipsHueCreateDeviceStatus,getPhilipsHueNewDevicesStatus',
  actions
)
class PhilipsHueDiscoveryPage extends Component {
  componentWillMount() {
    this.props.getPhilipsHueDevices();
    this.props.getHouses();
    this.props.getPhilipsHueNewDevices();
    this.props.getIntegrationByName('philips-hue');
  }

  render(props) {
    return (
      <PhilipsHuePage>
        <FoundDevices {...props} />
      </PhilipsHuePage>
    );
  }
}

export default PhilipsHueDiscoveryPage;
