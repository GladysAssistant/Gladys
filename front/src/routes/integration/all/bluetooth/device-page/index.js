import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import BluetoothPage from '../BluetoothPage';
import BluetoothDeviceTab from './BluetoothDeviceTab';

@connect('session,user,bluetoothDevices,houses,getBluetoothDevicesStatus', actions)
class BluetoothDevicePage extends Component {
  componentWillMount() {
    this.props.getBluetoothDevices();
    this.props.getHouses();
  }

  render(props, {}) {
    return (
      <BluetoothPage>
        <BluetoothDeviceTab {...props} />
      </BluetoothPage>
    );
  }
}

export default BluetoothDevicePage;
