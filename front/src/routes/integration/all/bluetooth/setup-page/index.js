import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import BluetoothPage from '../BluetoothPage';
import PeripheralTab from './PeripheralTab';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../../server/utils/constants';

@connect('user,session,bluetoothPeripheralUuids,bluetoothPeripherals,bluetoothStatus,bluetoothGetDriverStatus', actions)
class BluetoothSetupPage extends Component {
  componentWillMount() {
    this.props.getPeripherals();
    this.props.getStatus();

    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.BLUETOOTH.STATE, payload =>
      this.props.updateStatus(payload)
    );
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.BLUETOOTH.DISCOVER, payload =>
      this.props.addPeripheral(payload)
    );
  }

  render(props, {}) {
    return (
      <BluetoothPage>
        <PeripheralTab {...props} />
      </BluetoothPage>
    );
  }
}

export default BluetoothSetupPage;
