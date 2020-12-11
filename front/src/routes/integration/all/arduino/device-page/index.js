import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import ArduinoPage from '../ArduinoPage';
import DeviceTab from './DeviceTab';

@connect('session,user,devices,arduinoDevices,houses,arduinoConnected,usbPorts', actions)
class ArduinoDevicePage extends Component {
  componentWillMount() {
    this.props.getDevices();
    this.props.getArduinoDevices();
    this.props.getHouses();
    this.props.getIntegrationByName('arduino');
  }

  render(props, {}) {
    return (
      <ArduinoPage>
        <DeviceTab {...props} />
      </ArduinoPage>
    );
  }
}

export default ArduinoDevicePage;
