import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import BluetoothPage from '../BluetoothPage';
import NodeTab from './DeviceTab';

@connect('session,user,bluetoothDevices,houses,getBluetoothDevicesStatus', actions)
class BluetoothDevicePage extends Component {
  componentWillMount() {
    this.props.getBluetoothDevices(20, 0);
    this.props.getHouses();
  }

  render(props, {}) {
    return (
      <BluetoothPage>
        <NodeTab {...props} />
      </BluetoothPage>
    );
  }
}

export default BluetoothDevicePage;
