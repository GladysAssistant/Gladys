import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import ZwavePage from '../ZwavePage';
import NodeTab from './NodeTab';
import integrationConfig from '../../../../../config/integrations';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../../server/utils/constants';

@connect(
  'user,session,zwaveNodes,zwaveStatus,zwaveGetNodesStatus',
  actions
)
class ZwaveNodePage extends Component {
  componentWillMount() {
    this.props.getIntegrationByName('zwave');
    this.props.getNodes();
    this.props.getStatus();
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.ZWAVE.NODE_READY, payload =>
      this.props.addLocalNode(payload)
    );
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.ZWAVE.SCAN_COMPLETE, payload => {
      this.props.getStatus();
      this.props.getNodes();
    });
  }

  render(props, {}) {
    return (
      <ZwavePage integration={integrationConfig[props.user.language].zwave}>
        <NodeTab {...props} />
      </ZwavePage>
    );
  }
}

export default ZwaveNodePage;
