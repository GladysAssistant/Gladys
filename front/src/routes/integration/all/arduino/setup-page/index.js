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
class ArduinoSetupPage extends Component {
  
  

  render(props, {}) {
    return (
      <ArduinoPage integration={integrationConfig[props.user.language].arduino}>
        <SetupTab {...props} />
      </ArduinoPage>
    );
  }
}

export default ArduinoSetupPage;
