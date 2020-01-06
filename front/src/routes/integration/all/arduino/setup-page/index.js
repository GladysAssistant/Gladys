import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import ArduinoPage from '../ArduinoPage';
import SetupTab from './SetupTab';
import integrationConfig from '../../../../../config/integrations';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../../server/utils/constants';

@connect(
  'user,session,arduinoURL,arduinoUsername,arduinoPassword,connectArduinoStatus,arduinoConnected,arduinoConnectionError',
  actions
)
class ArduinoNodePage extends Component {
  componentWillMount() {
    this.props.getIntegrationByName('arduino');
    //this.props.loadProps();
    //this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.ARDUINO.CONNECTED, () =>
    //  this.props.displayConnectedMessage()
   // );
   // this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.ARDUINO.ERROR, payload =>
   //   this.props.displayArduinoError(payload)
    //);
  }

  render(props, {}) {
    return (
      <ArduinoPage integration={integrationConfig[props.user.language].arduino}>
        <SetupTab {...props} />
      </ArduinoPage>
    );
  }
}

export default ArduinoNodePage;
