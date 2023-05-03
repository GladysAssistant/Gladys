import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from '../actions';
import OverkizPage from '../OverkizPage';
import DiscoverTab from './DiscoverTab';

@connect('user,session,httpClient,housesWithRooms,discoveredDevices,loading,errorLoading', actions)
class OverkizIntegration extends Component {
  async componentWillMount() {
    this.props.getDiscoveredOverkizDevices();
    this.props.getHouses();
    this.props.getIntegrationByName('overkiz');
  }

  render(props) {
    return (
      <OverkizPage user={props.user}>
        <DiscoverTab {...props} />
      </OverkizPage>
    );
  }
}

export default OverkizIntegration;
