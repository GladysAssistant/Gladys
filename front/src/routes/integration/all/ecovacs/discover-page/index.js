import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from '../actions';
import EcovacsPage from '../EcovacsPage';
import DiscoverTab from './DiscoverTab';

class EcovacsIntegration extends Component {
  async componentWillMount() {
    this.props.getDiscoveredEcovacsDevices();
    this.props.getHouses();
    this.props.getIntegrationByName('ecovacs');
  }

  render(props) {
    return (
      <EcovacsPage user={props.user}>
        <DiscoverTab {...props} />
      </EcovacsPage>
    );
  }
}

export default connect(
  'user,session,httpClient,houses,discoveredDevices,loading,errorLoading',
  actions
)(EcovacsIntegration);
