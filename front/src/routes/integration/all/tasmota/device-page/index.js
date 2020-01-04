import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from '../actions';
import TasmotaPage from '../TasmotaPage';
import DeviceTab from './DeviceTab';

@connect('user,tasmotaDevices,housesWithRooms,getTasmotaStatus', actions)
class TasmotaIntegration extends Component {
  componentWillMount() {
    this.props.getTasmotaDevices(100, 0);
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

export default TasmotaIntegration;
