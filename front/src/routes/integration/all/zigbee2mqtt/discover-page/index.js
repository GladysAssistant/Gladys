import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import Zigbee2mqttPage from '../Zigbee2mqttPage';
import DiscoverTab from './DiscoverTab';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../../server/utils/constants';
import withIntlAsProp from '../../../../../utils/withIntlAsProp';

class Zigbee2mqttIntegration extends Component {
  componentWillMount() {
    this.props.session.dispatcher.addListener(
      WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.DISCOVER,
      this.props.setDiscoveredDevices
    );
    this.props.session.dispatcher.addListener(
      WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.PERMIT_JOIN,
      this.props.updatePermitJoin
    );

    this.props.checkStatus();
    this.props.getPermitJoin();
    this.props.setDiscoveredDevices(undefined);
    this.props.getHouses();
    this.props.getIntegrationByName('zigbee2mqtt');
    this.props.getDiscoveredDevices();
  }

  componentWillUnmount() {
    this.props.session.dispatcher.removeListener(
      WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.DISCOVER,
      this.props.setDiscoveredDevices
    );
    this.props.session.dispatcher.removeListener(
      WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.PERMIT_JOIN,
      this.props.updatePermitJoin
    );
  }

  render(props) {
    return (
      <Zigbee2mqttPage user={props.user}>
        <DiscoverTab {...props} dictionary={this.props.intl.dictionary} />
      </Zigbee2mqttPage>
    );
  }
}

export default withIntlAsProp(
  connect(
    'user,session,houses,zigbee2mqttDevices,discoverZigbee2mqtt,discoverZigbee2mqttError,permitJoin,gladysConnected,zigbee2mqttConnected,usbConfigured,z2mEnabled,filterExisting',
    actions
  )(Zigbee2mqttIntegration)
);
