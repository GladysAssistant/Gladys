import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import LANManagerPage from '../LANManagerPage';
import LANManagerDiscoverTab from './LANManagerDiscoverTab';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../../server/utils/constants';

class LANManagerDiscoverPage extends Component {
  componentWillMount() {
    this.props.getLanManagerStatus();
    this.props.getDiscoveredDevices();
    this.props.getHouses();

    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.LAN.SCANNING, this.props.handleStatus);
  }

  componentWillUnmount() {
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.LAN.SCANNING, this.props.handleStatus);
  }

  render(props, {}) {
    return (
      <LANManagerPage>
        <LANManagerDiscoverTab {...props} />
      </LANManagerPage>
    );
  }
}

export default connect(
  'session,httpClient,houses,lanManagerDiscoveredDevices,lanManagerGetDiscoveredDevicesStatus,lanManagerDiscoverUpdate,lanManagerStatus,filterExisting',
  actions
)(LANManagerDiscoverPage);
