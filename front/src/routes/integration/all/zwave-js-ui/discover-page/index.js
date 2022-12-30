import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import ZwaveJSUIPage from '../ZwaveJSUIPage';
import NodeTab from './NodeTab';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../../server/utils/constants';

@connect('user,session,zwaveNodes,zwaveStatus,zwaveGetNodesStatus,zwaveScanNetworkStatus', actions)
class ZwaveJSUINodePage extends Component {
  nodeReadyListener = () => this.props.getNodes();
  scanCompleteListener = () => {
    this.props.getStatus();
    this.props.getNodes();
  };
  componentWillMount() {
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.ZWAVEJSUI.NODE_READY, this.nodeReadyListener);
    this.props.session.dispatcher.addListener(
      WEBSOCKET_MESSAGE_TYPES.ZWAVEJSUI.SCAN_COMPLETE,
      this.scanCompleteListener
    );
    this.props.getIntegrationByName('zwave-js-ui');
    this.props.getNodes();
    this.props.getStatus();
  }

  componentWillUnmount() {
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.ZWAVEJSUI.NODE_READY, this.nodeReadyListener);
    this.props.session.dispatcher.removeListener(
      WEBSOCKET_MESSAGE_TYPES.ZWAVEJSUI.SCAN_COMPLETE,
      this.scanCompleteListener
    );
  }

  render(props, {}) {
    return (
      <ZwaveJSUIPage>
        <NodeTab {...props} />
      </ZwaveJSUIPage>
    );
  }
}

export default ZwaveJSUINodePage;
