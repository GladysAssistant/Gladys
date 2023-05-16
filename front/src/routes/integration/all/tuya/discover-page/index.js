import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from '../actions';
import DiscoverTab from './DiscoverTab';
import TuyaPage from '../TuyaPage';

class TuyaDiscoverPage extends Component {
  async componentWillMount() {
    this.props.getDiscoveredDevices();
    this.props.getHouses();
    this.props.getIntegrationByName('tuya');
  }

  render(props) {
    return (
      <TuyaPage user={props.user}>
        <DiscoverTab {...props} />
      </TuyaPage>
    );
  }
}

export default connect(
  'user,session,httpClient,housesWithRooms,discoveredDevices,loading,errorLoading',
  actions
)(TuyaDiscoverPage);
