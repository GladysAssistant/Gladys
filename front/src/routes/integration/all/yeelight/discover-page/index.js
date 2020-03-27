import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from '../actions';
import YeelightPage from '../YeelightPage';
import DiscoverTab from './DiscoverTab';

@connect('user,session,httpClient,housesWithRooms,discoveredDevices,loading,errorLoading', actions)
class YeelightIntegration extends Component {
  async componentWillMount() {
    this.props.getDiscoveredYeelightDevices();
    this.props.getHouses();
    this.props.getIntegrationByName('yeelight');
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
