import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import ZwaveJSUIPage from '../ZwaveJSUIPage';
import DeviceTab from './DeviceTab';

@connect('session,user,zwaveDevices,houses,getZwaveDevicesStatus,getZwaveDeviceOrderDir,zwaveDeviceSearch', actions)
class ZwaveJSUIDevicePage extends Component {
  componentWillMount() {
    this.props.getZWaveDevices();
    this.props.getHouses();
  }

  render(props, {}) {
    return (
      <ZwaveJSUIPage user="{props.user}">
        <DeviceTab {...props} />
      </ZwaveJSUIPage>
    );
  }
}

export default ZwaveJSUIDevicePage;
