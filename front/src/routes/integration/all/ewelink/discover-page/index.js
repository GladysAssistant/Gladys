import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from '../actions';
import EweLinkPage from '../EweLinkPage';
import DiscoverTab from './DiscoverTab';

class EweLinkIntegration extends Component {
  async componentWillMount() {
    this.props.getDiscoveredEweLinkDevices();
    this.props.getHouses();
    this.props.getIntegrationByName('ewelink');
  }

  render(props) {
    return (
      <EweLinkPage user={props.user}>
        <DiscoverTab {...props} />
      </EweLinkPage>
    );
  }
}

export default connect(
  'user,session,httpClient,housesWithRooms,discoveredDevices,loading,errorLoading',
  actions
)(EweLinkIntegration);
