import { Component } from 'preact';
import { connect } from 'unistore/preact';

import BluetoothPage from '../BluetoothPage';
import BluetoothSettingsTab from './BluetoothSettingsTab';
import actions from '../commons/actions';

class BluetoothSettingsPage extends Component {
  render(props) {
    return (
      <BluetoothPage>
        <BluetoothSettingsTab {...props} />
      </BluetoothPage>
    );
  }
}

export default connect('user,httpClient,bluetoothStatus', actions)(BluetoothSettingsPage);
