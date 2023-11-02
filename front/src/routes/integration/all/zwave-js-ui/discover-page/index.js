import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import ZwaveJSUIPage from '../ZwaveJSUIPage';
import NodeTab from './NodeTab';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../../server/utils/constants';

class ZwaveJSUINodePage extends Component {
  scanCompleteListener = () => {
    this.props.getStatus();
    this.props.getNodes();
  };

  componentWillMount() {
    this.props.session.dispatcher.addListener(
      WEBSOCKET_MESSAGE_TYPES.ZWAVEJSUI.STATUS_CHANGE,
      this.scanCompleteListener
    );
    this.props.session.dispatcher.addListener(
      WEBSOCKET_MESSAGE_TYPES.ZWAVEJSUI.SCAN_COMPLETE,
      this.scanCompleteListener
    );
    this.props.getIntegrationByName('zwave-js-ui');
    this.props.getNodes();
    this.props.getStatus();
  }

  componentWillUnmount() {
    this.props.session.dispatcher.removeListener(
      WEBSOCKET_MESSAGE_TYPES.ZWAVEJSUI.STATUS_CHANGE,
      this.scanCompleteListener
    );
    this.props.session.dispatcher.removeListener(
      WEBSOCKET_MESSAGE_TYPES.ZWAVEJSUI.SCAN_COMPLETE,
      this.scanCompleteListener
    );
  }

  render(props, {}) {
    return (
      <ZwaveJSUIPage user="{props.user}">
        <NodeTab {...props} />
      </ZwaveJSUIPage>
    );
  }
}

export default connect(
  'user,session,zwaveNodes,zwaveStatus,orderDir,searchKeyword,filterExisting,zwaveGetNodesStatus',
  actions
)(ZwaveJSUINodePage);
