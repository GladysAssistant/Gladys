import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import ArduinoPage from '../ArduinoPage';
import SetupTab from './SetupTab';
import integrationConfig from '../../../../../config/integrations';
import { RequestStatus } from '../../../../../utils/consts';

@connect(
  'user,session,connectArduinoStatus,arduinoConnected,arduinoConnectionError',
  actions
)
class ArduinoSetupPage extends Component {

  componentWillMount() {
    this.props.getUsbPorts();
  }

  render(props, { }) {
    const loading =
      props.getArduinoUsbPortStatus === RequestStatus.Getting;

    return (
      <ArduinoPage integration={integrationConfig[props.user.language].arduino}>
        <SetupTab {...props} loading={loading} />
      </ArduinoPage>
    );
  }
}

export default ArduinoSetupPage;
