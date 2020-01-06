import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import MiLightPage from '../MiLightPage';
import DevicePage from './DevicePage';
import FoundDevices from './FoundDevices';

@connect(
  'session,user,miLightDevices,houses,getMiLightDevicesStatus,miLightNewDevices,getMiLightCreateDeviceStatus',
  actions
)
class MiLightDevicePage extends Component {
  componentWillMount() {
    this.props.getMiLightDevices();
    this.props.getHouses();
    this.props.getMiLightNewDevices();
    this.props.getIntegrationByName('mi-light');
  }

  render(props, {}) {
    return (
      <MiLightPage>
        <DevicePage {...props} />
        <FoundDevices {...props} />
      </MiLightPage>
    );
  }
}

export default MiLightDevicePage;
