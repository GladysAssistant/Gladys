import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import ArduinoPage from '../ArduinoPage';
import SetupTab from './SetupTab';

@connect(
  'user,session,usbPorts,arduinoDevices,arduinoModelsList,arduinoManufacturersList',
  actions
)
class ArduinoSetupPage extends Component {

  componentWillMount() {
    this.props.getArduinoDevices();
    this.props.getModels();
    this.props.getManufacturers();
    this.props.getUsbPorts();
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
