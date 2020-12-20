import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from '../actions';
import EweLinkPage from '../EweLinkPage';
import SetupTab from './SetupTab';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../../server/utils/constants';

@connect(
  'user,session,eweLinkUsername,eweLinkPassword,connectEweLinkStatus,eweLinkConnected,eweLinkConnectionError',
  actions
)
class EweLinkSetupPage extends Component {
  componentWillMount() {
    this.props.getIntegrationByName('ewelink');
    this.props.loadProps();
    this.props.session.dispatcher.addListener(
      WEBSOCKET_MESSAGE_TYPES.EWELINK.CONNECTED,
      this.props.displayConnectedMessage
    );
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.EWELINK.ERROR, this.props.displayEweLinkError);
  }

  componentWillUnmount() {
    this.props.session.dispatcher.removeListener(
      WEBSOCKET_MESSAGE_TYPES.EWELINK.CONNECTED,
      this.props.displayConnectedMessage
    );
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.EWELINK.ERROR, this.props.displayEweLinkError);
  }

  render(props, {}) {
    return (
      <EweLinkPage>
        <SetupTab {...props} />
      </EweLinkPage>
    );
  }
}

export default EweLinkSetupPage;
