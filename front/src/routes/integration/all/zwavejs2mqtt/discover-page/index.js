import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import Zwavejs2mqttPage from '../Zwavejs2mqttPage';
import NodeTab from './NodeTab';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../../server/utils/constants';

@connect('user,session,zwaveNodes,zwaveStatus,zwaveGetNodesStatus,zwaveHealNetworkStatus', actions)
class Zwavejs2mqttNodePage extends Component {
  nodeReadyListener = () => this.props.getNodes();
  scanCompleteListener = () => {
    this.props.getStatus();
    this.props.getNodes();
  };
  componentWillMount() {
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.ZWAVEJS2MQTT.NODE_READY, this.nodeReadyListener);
    this.props.session.dispatcher.addListener(
      WEBSOCKET_MESSAGE_TYPES.ZWAVEJS2MQTT.SCAN_COMPLETE,
      this.scanCompleteListener
    );
    this.props.getIntegrationByName('zwave');
    this.props.getNodes();
    this.props.getStatus();
  }

  componentWillUnmount() {
    this.props.session.dispatcher.removeListener(
      WEBSOCKET_MESSAGE_TYPES.ZWAVEJS2MQTT.NODE_READY,
      this.nodeReadyListener
    );
    this.props.session.dispatcher.removeListener(
      WEBSOCKET_MESSAGE_TYPES.ZWAVEJS2MQTT.SCAN_COMPLETE,
      this.scanCompleteListener
    );
  }

  render(props, {}) {
    return (
      <Zwavejs2mqttPage>
        <NodeTab {...props} />
      </Zwavejs2mqttPage>
    );
  }
}

export default Zwavejs2mqttNodePage;
