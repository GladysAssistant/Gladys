import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import ArduinoPage from '../ArduinoPage';
import SetupTab from './SetupTab';

@connect('user,session,usbPorts,arduinoDeviceSearch,getArduinoDeviceOrderDir,connectArduinoStatus,arduinoConnected,arduinoConnectionError,getArduinoUsbPortStatus,getArduinoDevicesStatus,getArduinoCreateDevicesStatus,getArduinoNewDevicesStatus,arduinoDevices,arduinoDevicesMap,arduinoNewDevices', actions)
class ArduinoSetupPage extends Component {

  componentWillMount() {
    this.props.getUsbPorts();
    this.props.getStatus();
    //this.props.getArduinoDevices();
  }

  componentWillUnmount() {
  }

  render(props, { }) {
    return (
      <ArduinoPage>
        <SetupTab {...props} />
      </ArduinoPage>
    );
  }
}

export default ArduinoSetupPage;
