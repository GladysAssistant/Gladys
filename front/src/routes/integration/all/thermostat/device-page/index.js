import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import ThermostatPage from '../ThermostatPage';
import DeviceTab from './DeviceTab';
import { withMobileViewport } from '../../../../../components/mobile';

class ThermostatDevicePage extends Component {
  componentWillMount() {
    this.props.getThermostatDevices();
    this.props.getHouses();
    this.props.getSchedules();
  }

  render(props) {
    return (
      <ThermostatPage user={props.user}>
        <DeviceTab {...props} />
      </ThermostatPage>
    );
  }
}

export default connect(
  'user,houses,thermostatDevices,getThermostatDevicesStatus,thermostatDeviceSearch,getThermostatDeviceOrderDir,thermostatSchedules',
  actions
)(withMobileViewport(ThermostatDevicePage));
