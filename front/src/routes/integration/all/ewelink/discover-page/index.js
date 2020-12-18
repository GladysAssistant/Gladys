import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from '../actions';
import EweLinkPage from '../EweLinkPage';
import DiscoverTab from './DiscoverTab';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../../server/utils/constants';

@connect('user,session,httpClient,housesWithRooms,discoveredDevices,loading,errorLoading', actions)
class EweLinkIntegration extends Component {
  async componentWillMount() {
    this.props.getDiscoveredEweLinkDevices();
    this.props.getHouses();
    this.props.getIntegrationByName('ewelink');

    this.props.session.dispatcher.addListener(
      WEBSOCKET_MESSAGE_TYPES.EWELINK.NEW_DEVICE,
      this.props.addDiscoveredDevice
    );
  }

  componentWillUnmount() {
    this.props.session.dispatcher.removeListener(
      WEBSOCKET_MESSAGE_TYPES.EWELINK.NEW_DEVICE,
      this.props.addDiscoveredDevice
    );
  }

  render(props) {
    return (
      <EweLinkPage user={props.user}>
        <DiscoverTab {...props} />
      </EweLinkPage>
    );
  }
}

export default EweLinkIntegration;
