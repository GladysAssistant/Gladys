import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import Zigbee2mqttPage from '../Zigbee2mqttPage';
import DiscoverTab from './DiscoverTab';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../../server/utils/constants';
import withIntlAsProp from '../../../../../utils/withIntlAsProp';
import { withMobileViewport } from '../../../../../components/mobile';
import PairingScreen from '../setup-page/pairing/PairingScreen';

class Zigbee2mqttIntegration extends Component {
  state = { pairing: false };

  // "Pair a device": the pairing window (docs/specs/zigbee2mqtt-pairing.md, D.1), back to the list once closed
  openPairing = () => this.setState({ pairing: true });

  // The devices added from the window are no longer new: the list is read again
  closePairing = () => {
    this.setState({ pairing: false });
    this.props.getDiscoveredDevices();
  };

  componentWillMount() {
    this.props.session.dispatcher.addListener(
      WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.DISCOVER,
      this.props.setDiscoveredDevices
    );
    // The Zigbee2mqtt status ("Pair a device", banner) is loaded and followed by CheckStatus, which the pairing screen
    // replaces with the list: followed here too, the screen tells Zigbee2mqtt no longer answering (D.5)
    this.props.session.dispatcher.addListener(
      WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.STATUS_CHANGE,
      this.props.updateStatus
    );

    this.props.setDiscoveredDevices(undefined);
    this.props.getHouses();
    this.props.getIntegrationByName('zigbee2mqtt');
    this.props.getDiscoveredDevices();
    this.props.getZ2mUrl();
  }

  componentWillUnmount() {
    this.props.session.dispatcher.removeListener(
      WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.DISCOVER,
      this.props.setDiscoveredDevices
    );
    this.props.session.dispatcher.removeListener(
      WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.STATUS_CHANGE,
      this.props.updateStatus
    );
  }

  render(props, { pairing }) {
    return (
      <Zigbee2mqttPage user={props.user}>
        {pairing ? (
          <PairingScreen
            isMobile={props.isMobile}
            httpClient={props.httpClient}
            session={props.session}
            online={Boolean(props.zigbee2mqttConnected)}
            brokerConnected={props.gladysConnected}
            onClose={this.closePairing}
            backLabelId="integration.zigbee2mqtt.discoverTab"
          />
        ) : (
          <DiscoverTab {...props} dictionary={this.props.intl.dictionary} openPairing={this.openPairing} />
        )}
      </Zigbee2mqttPage>
    );
  }
}

export default withIntlAsProp(
  connect(
    'user,session,httpClient,houses,zigbee2mqttDevices,discoverZigbee2mqtt,discoverZigbee2mqttError,gladysConnected,zigbee2mqttConnected,usbConfigured,z2mEnabled,filterExisting,z2mUrl,showZ2mUrlWarning,z2mConfigured',
    actions
  )(withMobileViewport(Zigbee2mqttIntegration))
);
