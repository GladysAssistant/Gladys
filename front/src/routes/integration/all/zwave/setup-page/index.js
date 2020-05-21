import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import ZwavePage from '../ZwavePage';
import NodeTab from './NodeTab';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../../server/utils/constants';

@connect('user,session,zwaveNodes,zwaveStatus,zwaveGetNodesStatus,zwaveHealNetworkStatus', actions)
class ZwaveNodePage extends Component {
  nodeReadyListener = payload => this.props.getNodes();
  scanCompleteListener = () => {
    this.props.getStatus();
    this.props.getNodes();
  };
  componentWillMount() {
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.ZWAVE.NODE_READY, this.nodeReadyListener);
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.ZWAVE.SCAN_COMPLETE, this.scanCompleteListener);
    this.props.getIntegrationByName('zwave');
    this.props.getNodes();
    this.props.getStatus();
  }

  componentWillUnmount() {
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.ZWAVE.NODE_READY, this.nodeReadyListener);
    this.props.session.dispatcher.removeListener(
      WEBSOCKET_MESSAGE_TYPES.ZWAVE.SCAN_COMPLETE,
      this.scanCompleteListener
    );
  }

  render(props, {}) {
    return (
      <ZwavePage>
        <NodeTab {...props} />
      </ZwavePage>
    );
  }
}

export default ZwaveNodePage;
