import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import ArduinoPage from '../ArduinoPage';
import DeviceTab from './DeviceTab';
import integrationConfig from '../../../../../config/integrations';

@connect(
  'session,user,arduinoDevices,houses,arduinoConnected,usbPorts, devices',
  actions
)
class ArduinoDevicePage extends Component {
  componentWillMount() {
    this.props.getArduinoDevices();
    this.props.getHouses();
    this.props.getIntegrationByName('arduino');
  }

  render(props, { }) {
    return (
      <ArduinoPage integration={integrationConfig[props.user.language].arduino}>
        <DeviceTab {...props} />
      </ArduinoPage>
    );
  }
}

export default ArduinoDevicePage;
