import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from '../actions';
import Zwave2mqttPage from '../Zwave2mqttPage';
import DiscoverTab from './DiscoverTab';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../../server/utils/constants';

@connect('user,session,httpClient,housesWithRooms,discoveredDevices,loading,errorLoading', actions)
class Zwave2mqttIntegration extends Component {
  async componentWillMount() {
    this.props.checkStatus();
    this.props.getDiscoveredZwave2mqttDevices();
    this.props.getHouses();
    this.props.getIntegrationByName('zwave2mqtt');

    this.props.session.dispatcher.addListener(
      WEBSOCKET_MESSAGE_TYPES.ZWAVE2MQTT.DISCOVER_COMPLETE,
      this.props.getDiscoveredZwave2mqttDevices
    );
  }

  componentWillUnmount() {
    this.props.session.dispatcher.removeListener(
      WEBSOCKET_MESSAGE_TYPES.ZWAVE2MQTT.DISCOVER_COMPLETE,
      this.props.getDiscoveredZwave2mqttDevices
    );
  }

  render(props) {
    return (
      <Zwave2mqttPage user={props.user}>
        <DiscoverTab {...props} />
      </Zwave2mqttPage>
    );
  }
}

export default Zwave2mqttIntegration;
