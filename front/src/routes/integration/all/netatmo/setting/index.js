import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from '../actions';
import NetatmoPage from '../NetatmoPage';
import SettingTab from './SettingTab';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../../server/utils/constants';

@connect(
  'user,session, netatmoUsername, netatmoPassword, netatmoClientId, netatmoClientSecret, netatmoConnectStatus, netatmoConnected, netatmoConnectedMessage, netatmoConnectStatus, netatmoConnectionError, netatmoConnectedError',
  actions
)
class NetatmoNodePage extends Component {
  componentWillMount() {
    this.props.getIntegrationByName('netatmo');
    this.props.loadProps();
    this.props.session.dispatcher.addListener(
      WEBSOCKET_MESSAGE_TYPES.NETATMO.CONNECTED,
      this.props.displayConnectedMessage
    );
    this.props.session.dispatcher.addListener(
      WEBSOCKET_MESSAGE_TYPES.NETATMO.DISCONNECTED,
      this.props.displayDisconnectedMessage
    );
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.NETATMO.ERROR, this.props.displayNetatmoError);
  }
  componentWillUnmount() {
    this.props.session.dispatcher.removeListener(
      WEBSOCKET_MESSAGE_TYPES.NETATMO.CONNECTED,
      this.props.displayConnectedMessage
    );
    this.props.session.dispatcher.removeListener(
      WEBSOCKET_MESSAGE_TYPES.NETATMO.DISCONNECTED,
      this.props.displayDisconnectedMessage
    );
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.NETATMO.ERROR, this.props.displayNetatmoError);
  }

  render(props, {}) {
    return (
      <NetatmoPage>
        <SettingTab {...props} />
      </NetatmoPage>
    );
  }
}

export default NetatmoNodePage;
