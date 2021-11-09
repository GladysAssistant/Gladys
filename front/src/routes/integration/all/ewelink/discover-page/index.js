import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from '../actions';
import EweLinkPage from '../EweLinkPage';
import DiscoverTab from './DiscoverTab';

@connect('user,session,httpClient,discoveredDevices,loading,errorLoading', actions)
class EweLinkIntegration extends Component {
  async componentWillMount() {
    this.props.getDiscoveredEweLinkDevices();
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

export default EweLinkIntegration;
