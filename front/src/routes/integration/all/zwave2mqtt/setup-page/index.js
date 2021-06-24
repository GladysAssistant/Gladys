import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import Zwave2mqttPage from '../Zwave2mqttPage';
import SetupTab from './SetupTab';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../../server/utils/constants';

@connect(
  'user,session,z2mEnabled,mqttExist,mqttRunning,dockerBased,networkModeValid,zwave2mqttExist,zwave2mqttRunning,gladysConnected,zwave2mqttConnected,zwave2mqttConfigured',
  actions
)
class Zwave2mqttSetupPage extends Component {
  async componentWillMount() {
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.ZWAVE2MQTT.STATUS_CHANGE, this.props.checkStatus);

    await this.props.checkStatus();
  }

  componentWillUnmount() {
    this.props.session.dispatcher.removeListener(
      WEBSOCKET_MESSAGE_TYPES.ZWAVE2MQTT.STATUS_CHANGE,
      this.props.checkStatus
    );
  }

  render(props, {}) {
    return (
      <Zwave2mqttPage user={props.user}>
        <SetupTab {...props} />
      </Zwave2mqttPage>
    );
  }
}

export default Zwave2mqttSetupPage;
