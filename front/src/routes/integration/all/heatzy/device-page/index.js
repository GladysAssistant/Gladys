import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import HeatzyPage from '../HeatzyPage';
import DeviceTab from './DeviceTab';

@connect('session,user,heatzyDevices,houses,getHeatzyDevicesStatus', actions)
class HeatzyDevicePage extends Component {
  componentWillMount() {
    this.props.getHeatzyDevices(20, 0);
    this.props.getHouses();
    this.props.getIntegrationByName('heatzy');
  }

  render(props, {}) {
    return (
      <HeatzyPage>
        <DeviceTab {...props} />
      </HeatzyPage>
    );
  }
}

export default HeatzyDevicePage;
