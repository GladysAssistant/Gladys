import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import ArduinoPage from '../ArduinoPage';
import SetupTab from './SetupTab';

@connect(
  'user,session,usbPorts,arduinoInfos,arduinoPath,arduinoStatus,getArduinoUsbPortStatus,getCurrentArduinoPathStatus,arduinoGetStatus,arduinoDriverFailed,arduinoDisconnectStatus,connectArduinoStatus,arduinoConnectionInProgress', 
  actions
)
class ArduinoSetupPage extends Component {

  componentWillMount() {
    this.props.getUsbPorts();
    this.props.getInfos();
    this.props.getStatus();
    this.props.getCurrentArduinoPath();
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
