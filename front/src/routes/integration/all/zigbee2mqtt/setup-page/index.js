import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import Zigbee2mqttPage from '../Zigbee2mqttPage';
import SetupTab from './SetupTab';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../../server/utils/constants';

class Zigbee2mqttSetupPage extends Component {
  async componentWillMount() {
    this.props.session.dispatcher.addListener(
      WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.STATUS_CHANGE,
      this.props.checkStatus
    );

    await this.props.checkStatus();
  }

  componentWillUnmount() {
    this.props.session.dispatcher.removeListener(
      WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.STATUS_CHANGE,
      this.props.checkStatus
    );
  }

  render(props, {}) {
    return (
      <Zigbee2mqttPage user={props.user}>
        <SetupTab {...props} />
      </Zigbee2mqttPage>
    );
  }
}

export default connect(
  'user,session,z2mEnabled,usbConfigured,mqttExist,mqttRunning,dockerBased,networkModeValid,zigbee2mqttExist,zigbee2mqttRunning,gladysConnected,zigbee2mqttConnected,usbConfigured,z2mUrl',
  actions
)(Zigbee2mqttSetupPage);
