import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import ArduinoPage from '../ArduinoPage';
import SetupTab from './SetupTab';

@connect(
  'user,session,usbPorts,arduinoInfos,arduinoPath,arduinoStatus,arduinoModels,getArduinoUsbPortStatus,getCurrentArduinoPathStatus,arduinoGetStatus,arduinoDriverFailed,arduinoDisconnectStatus,arduinoConnected,connectArduinoStatus,arduinoConnectionInProgress',
  actions
)
class ArduinoSetupPage extends Component {

  componentWillMount() {
    this.props.checkConnected();
    this.props.getCurrentArduinoPath();
    this.props.getModel();
    //this.props.getUsbPorts();
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
