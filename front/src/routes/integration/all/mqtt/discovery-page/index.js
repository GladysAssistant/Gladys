import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import MqttPage from '../MqttPage';
import DiscoverTab from './DiscoverTab';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../../server/utils/constants';

class MqttDiscoveryPage extends Component {
  componentWillMount() {
    this.props.session.dispatcher.addListener(
      WEBSOCKET_MESSAGE_TYPES.MQTT.HA_DISCOVERY_DEVICES_UPDATED,
      this.props.setDiscoveredDevices
    );
    this.props.getHouses();
    this.props.getDiscoveredDevices();
  }

  componentWillUnmount() {
    this.props.session.dispatcher.removeListener(
      WEBSOCKET_MESSAGE_TYPES.MQTT.HA_DISCOVERY_DEVICES_UPDATED,
      this.props.setDiscoveredDevices
    );
  }

  render(props) {
    return (
      <MqttPage user={props.user}>
        <DiscoverTab {...props} />
      </MqttPage>
    );
  }
}

export default connect(
  'user,session,houses,mqttDiscoveredDevices,mqttDiscoveryLoading,mqttDiscoveryError,mqttDiscoveryFilterExisting',
  actions
)(MqttDiscoveryPage);
