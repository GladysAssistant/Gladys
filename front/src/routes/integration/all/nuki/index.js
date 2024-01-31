import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import NukiPage from './NukiPage';
import DeviceTab from './device-page/DeviceTab';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../server/utils/constants';

class NukiIntegration extends Component {
  componentWillMount() {
    this.props.getIntegrationByName('nuki');
    this.props.getNukiDevices();
    this.props.getHouses();
    this.props.loadProps();
    this.props.session.dispatcher.addListener(
      WEBSOCKET_MESSAGE_TYPES.NUKI.CONNECTED,
      this.props.displayConnectedMessage
    );
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.NUKI.ERROR, this.props.displayNukiError);
  }

  componentWillUnmount() {
    this.props.session.dispatcher.removeListener(
      WEBSOCKET_MESSAGE_TYPES.NUKI.CONNECTED,
      this.props.displayConnectedMessage
    );
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.NUKI.ERROR, this.props.displayNukiError);
  }

  render(props, {}) {
    return (
      <NukiPage>
        <DeviceTab {...props} />
      </NukiPage>
    );
  }
}

export default connect(
  'user,session,nukiUsername,nukiPassword,nukiConnectionStatus,nukiConnected,nukiConnectionError,nukiDevices,housesWithRooms,getNukiStatus,nukiSearch,getNukiOrderDir',
  actions
)(NukiIntegration);