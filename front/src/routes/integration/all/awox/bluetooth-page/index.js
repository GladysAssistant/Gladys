import { Component } from 'preact';
import { connect } from 'unistore/preact';

import actions from './actions';
import AwoxPage from '../AwoxPage';
import AwoxPeripheralTab from './AwoxPeripheralTab';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../../server/utils/constants';

@connect('user,session,awoxPeripherals,bluetoothStatus,currentIntegration', actions)
class AwoxBluetoothPage extends Component {
  componentWillMount() {
    this.props.getIntegrationByName('awox');
    this.props.getPeripherals();
    this.props.getStatus();

    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.BLUETOOTH.STATE, this.props.getPeripherals);
  }

  componentWillUnmount() {
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.BLUETOOTH.STATE, this.props.getPeripherals);
  }

  render(props, {}) {
    return (
      <AwoxPage user={props.user}>
        <AwoxPeripheralTab {...props} />
      </AwoxPage>
    );
  }
}

export default AwoxBluetoothPage;
