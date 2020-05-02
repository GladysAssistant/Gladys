import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from '../actions';
import W215Page from '../W215Page';
import DiscoverTab from './DiscoverTab';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../../server/utils/constants';

@connect('user,session,httpClient,housesWithRooms,discoveredDevices,loading,errorLoading', actions)
class W215Integration extends Component {
  async componentWillMount() {
    this.props.getDiscoveredW215Devices();
    this.props.getHouses();
    this.props.getIntegrationByName('w215');

    this.props.session.dispatcher.addListener(
      // TODO
      //WEBSOCKET_MESSAGE_TYPES.EWELINK.NEW_DEVICE,
      WEBSOCKET_MESSAGE_TYPES.W215.NEW_DEVICE,

      this.props.addDiscoveredDevice
    );
  }

  render(props) {
    return (
      <W215Page user={props.user}>
        <DiscoverTab {...props} />
      </W215Page>
    );
  }
}

export default W215Integration;
