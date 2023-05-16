import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from '../actions';
import TasmotaPage from '../TasmotaPage';
import DiscoverTab from './DiscoverTab';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../../server/utils/constants';

class TasmotaIntegration extends Component {
  async componentWillMount() {
    this.props.getDiscoveredTasmotaDevices('http');
    this.props.getHouses();
    this.props.getIntegrationByName('tasmota');

    this.props.session.dispatcher.addListener(
      WEBSOCKET_MESSAGE_TYPES.TASMOTA.NEW_HTTP_DEVICE,
      this.props.addDiscoveredDevice
    );
  }

  componentWillUnmount() {
    this.props.session.dispatcher.removeListener(
      WEBSOCKET_MESSAGE_TYPES.TASMOTA.NEW_HTTP_DEVICE,
      this.props.addDiscoveredDevice
    );
  }

  render(props) {
    return (
      <TasmotaPage user={props.user}>
        <DiscoverTab {...props} />
      </TasmotaPage>
    );
  }
}

export default connect(
  'user,session,httpClient,housesWithRooms,discoveredDevices,loading,errorLoading',
  actions
)(TasmotaIntegration);
