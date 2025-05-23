import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from '../actions';
import NukiPage from '../NukiPage';
import DiscoverTab from './DiscoverTab';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../../server/utils/constants';

class NukiIntegration extends Component {
  async componentWillMount() {
    this.props.getDiscoveredNukiDevices('http');
    this.props.getHouses();
    this.props.getIntegrationByName('nuki');

    this.props.session.dispatcher.addListener(
      WEBSOCKET_MESSAGE_TYPES.NUKI.NEW_HTTP_DEVICE,
      this.props.addDiscoveredDevice
    );
  }

  componentWillUnmount() {
    this.props.session.dispatcher.removeListener(
      WEBSOCKET_MESSAGE_TYPES.NUKI.NEW_HTTP_DEVICE,
      this.props.addDiscoveredDevice
    );
  }

  render(props) {
    return (
      <NukiPage user={props.user}>
        <DiscoverTab {...props} />
      </NukiPage>
    );
  }
}

export default connect(
  'user,session,httpClient,housesWithRooms,discoveredDevices,loading,errorLoading',
  actions
)(NukiIntegration);
