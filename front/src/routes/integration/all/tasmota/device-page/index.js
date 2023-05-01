import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from '../actions';
import TasmotaPage from '../TasmotaPage';
import DeviceTab from './DeviceTab';

class TasmotaIntegration extends Component {
  componentWillMount() {
    this.props.getTasmotaDevices();
    this.props.getHouses();
    this.props.getIntegrationByName('tasmota');
  }

  render(props, {}) {
    return (
      <TasmotaPage user={props.user}>
        <DeviceTab {...props} />
      </TasmotaPage>
    );
  }
}

export default connect(
  'user,tasmotaDevices,housesWithRooms,getTasmotaStatus,tasmotaSearch,getTasmotaOrderDir',
  actions
)(TasmotaIntegration);
