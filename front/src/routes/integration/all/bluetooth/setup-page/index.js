import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import BluetoothPage from '../BluetoothPage';
import BluetoothPeripheralTab from './BluetoothPeripheralTab';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../../server/utils/constants';

@connect('user,session,bluetoothPeripheralUuids,bluetoothPeripherals,bluetoothStatus,bluetoothGetDriverStatus', actions)
class BluetoothSetupPage extends Component {
  componentWillMount() {
    this.props.getPeripherals();
    this.props.getStatus();

    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.BLUETOOTH.STATE, this.props.updateStatus);
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.BLUETOOTH.DISCOVER, this.props.addPeripheral);
  }

  componentWillUnmount() {
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.BLUETOOTH.STATE, this.props.updateStatus);
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.BLUETOOTH.DISCOVER, this.props.addPeripheral);
  }

  render(props, {}) {
    return (
      <BluetoothPage>
        <BluetoothPeripheralTab {...props} />
      </BluetoothPage>
    );
  }
}

export default BluetoothSetupPage;
