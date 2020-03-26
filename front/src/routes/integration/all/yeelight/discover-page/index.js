import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from '../actions';
import YeelightPage from '../YeelightPage';
import DiscoverTab from './DiscoverTab';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../../server/utils/constants';

@connect('user,session,httpClient,housesWithRooms,discoveredDevices,loading,errorLoading', actions)
class YeelightIntegration extends Component {
  async componentWillMount() {
    this.props.getDiscoveredYeelightDevices();
    this.props.getHouses();
    this.props.getIntegrationByName('yeelight');

    this.props.session.dispatcher.addListener(
      WEBSOCKET_MESSAGE_TYPES.YEELIGHT.NEW_DEVICE,
      this.props.addDiscoveredDevice
    );
  }

  componentWillUnmount() {
    this.props.session.dispatcher.removeListener(
      WEBSOCKET_MESSAGE_TYPES.YEELIGHT.NEW_DEVICE,
      this.props.addDiscoveredDevice
    );
  }

  render(props) {
    return (
      <YeelightPage user={props.user}>
        <DiscoverTab {...props} />
      </YeelightPage>
    );
  }
}

export default YeelightIntegration;
