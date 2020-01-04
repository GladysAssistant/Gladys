import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from '../actions';
import TasmotaPage from '../TasmotaPage';
import DiscoverTab from './DiscoverTab';

@connect('user,httpClient,housesWithRooms,discoveredDevices,loading,errorLoading', actions)
class TasmotaIntegration extends Component {
  async componentWillMount() {
    this.props.getDiscoveredTasmotaDevices();
    this.props.getHouses();
    this.props.getIntegrationByName('tasmota');
  }

  render(props) {
    return (
      <TasmotaPage user={props.user}>
        <DiscoverTab {...props} />
      </TasmotaPage>
    );
  }
}

export default TasmotaIntegration;
