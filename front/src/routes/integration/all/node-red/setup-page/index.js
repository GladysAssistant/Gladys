import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import NodeRedPage from '../NodeRedPage';
import SetupTab from './SetupTab';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../../server/utils/constants';

class NodeRedSetupPage extends Component {
  async componentWillMount() {
    this.props.session.dispatcher.addListener(
      WEBSOCKET_MESSAGE_TYPES.NODERED.STATUS_CHANGE,
      this.props.checkStatus
    );

    await this.props.checkStatus();
  }

  componentWillUnmount() {
    this.props.session.dispatcher.removeListener(
      WEBSOCKET_MESSAGE_TYPES.NODERED.STATUS_CHANGE,
      this.props.checkStatus
    );
  }

  render(props, {}) {
    return (
      <NodeRedPage user={props.user}>
        <SetupTab {...props} />
      </NodeRedPage>
    );
  }
}

export default connect(
  'user,session,nodeRedExist,nodeRedRunning,nodeRedEnabled,gladysConnected,dockerBased,networkModeValid',
  actions
)(NodeRedSetupPage);
