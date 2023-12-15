import { connect } from 'unistore/preact';
import BluetoothPage from '../BluetoothPage';
import UpdateDevice from '../../../../../components/device';

const BLUETOOTH_PAGE_PATH = '/dashboard/integration/device/bluetooth';

const BluetoothEditDevicePage = props => (
  <BluetoothPage user={props.user}>
    <UpdateDevice
      {...props}
      integrationName="bluetooth"
      allowModifyFeatures={false}
      previousPage={BLUETOOTH_PAGE_PATH}
    />
  </BluetoothPage>
);

export default connect('user,session,httpClient,currentIntegration,houses', {})(BluetoothEditDevicePage);
