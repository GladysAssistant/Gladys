import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import { Text } from 'preact-i18n';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../../server/utils/constants';

class CheckBluetoothPanel extends Component {
  componentWillMount() {
    this.props.getStatus();
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.BLUETOOTH.STATE, this.props.updateStatus);
  }

  componentWillUnmount() {
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.BLUETOOTH.STATE, this.props.updateStatus);
  }

  render({ bluetoothStatus }) {
    if (!bluetoothStatus || bluetoothStatus.ready) {
      return null;
    }

    return (
      <div class="alert alert-warning">
        <Text id="integration.bluetooth.bluetoothNotReadyError" />
      </div>
    );
  }
}

export default connect('user,session,bluetoothStatus', actions)(CheckBluetoothPanel);
