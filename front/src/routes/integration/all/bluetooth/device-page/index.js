import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import BluetoothPage from '../BluetoothPage';
import BluetoothDeviceTab from './BluetoothDeviceTab';
import { withMobileViewport } from '../../../../../components/mobile';

class BluetoothDevicePage extends Component {
  componentWillMount() {
    this.props.getBluetoothDevices();
    this.props.getHouses();
  }

  render(props, {}) {
    return (
      <BluetoothPage user={props.user}>
        <BluetoothDeviceTab {...props} />
      </BluetoothPage>
    );
  }
}

export default connect(
  'session,user,bluetoothDevices,houses,getBluetoothDevicesStatus,bluetoothDeviceSearch,getBluetoothDeviceOrderDir',
  actions
)(withMobileViewport(BluetoothDevicePage));
