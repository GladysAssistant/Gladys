import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import BroadlinkPage from '../BroadlinkPage';
import DeviceTab from './DeviceTab';

@connect('session,user,broadlinkDevices,getBroadlinkDevicesStatus,housesWithRooms', actions)
class BroadlinkDevicePage extends Component {
  componentWillMount() {
    this.props.getBroadlinkRemotes();
    this.props.getHouses();
    this.props.getIntegrationByName('broadlink');
  }

  render(props) {
    return (
      <BroadlinkPage>
        <DeviceTab {...props} />
      </BroadlinkPage>
    );
  }
}

export default BroadlinkDevicePage;
