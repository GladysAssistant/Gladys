import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import SonoffPage from '../SonoffPage';
import DiscoverTab from './DiscoverTab';

@connect(
  'user,httpClient,housesWithRooms,discoveredDevices,loading,errorLoading',
  actions
)
class SonoffIntegration extends Component {
  async componentWillMount() {
    this.props.getDiscoveredSonoffDevices();
    this.props.getHouses();
    this.props.getIntegrationByName('sonoff');
  }

  render(props) {
    return (
      <SonoffPage>
        <DiscoverTab {...props} />
      </SonoffPage>
    );
  }
}

export default SonoffIntegration;
