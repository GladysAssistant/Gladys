import { connect } from 'unistore/preact';

import BluetoothPage from '../BluetoothPage';
import BluetoothSettingsTab from './BluetoothSettingsTab';
import actions from '../commons/actions';

const BluetoothSettingsPage = props => (
  <BluetoothPage user={props.user}>
    <BluetoothSettingsTab {...props} />
  </BluetoothPage>
);

export default connect('user,httpClient,bluetoothStatus', actions)(BluetoothSettingsPage);
