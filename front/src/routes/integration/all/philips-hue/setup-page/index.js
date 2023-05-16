import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import PhilipsHuePage from '../PhilipsHuePage';
import SetupTab from './SetupTab';

class PhilipsHueSetupPage extends Component {
  componentWillMount() {
    // this.props.getIntegrationByName('philips-hue');
    this.props.getBridges();
    this.props.getPhilipsHueDevices();
  }

  render(props, {}) {
    return (
      <PhilipsHuePage>
        <SetupTab {...props} />
      </PhilipsHuePage>
    );
  }
}

export default connect(
  'user,philipsHueBridges,philipsHueBridgesDevices,philipsHueGetDevicesStatus,philipsHueCreateDeviceStatus,philipsHueGetBridgesStatus,philipsHueDeleteDeviceStatus',
  actions
)(PhilipsHueSetupPage);
