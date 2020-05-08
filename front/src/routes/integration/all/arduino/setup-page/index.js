import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import ArduinoPage from '../ArduinoPage';
import SetupTab from './SetupTab';

@connect(
  'user,session,usbPorts,arduinoInfos,arduinoDevices,arduinoPath,arduinoStatus,arduinoModelsList,arduinoModel,getArduinoUsbPortStatus,getCurrentArduinoPathStatus,getCurrentArduinoModelStatus,setArduinoModel,arduinoDiscardModel,arduinoGetStatus,arduinoDriverFailed,arduinoDisconnectStatus,arduinoConnected,connectArduinoStatus,arduinoConnectionInProgress,arduinoManufacturersList',
  actions
)
class ArduinoSetupPage extends Component {

  componentWillMount() {
    //this.props.checkConnected();
    //this.props.getCurrentArduinoPath();
    //this.props.getCurrentArduinoModel();
    this.props.getModels();
    this.props.getManufacturers();
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
