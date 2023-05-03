import { Component } from 'preact';
import { connect } from 'unistore/preact';
import BluetoothPage from '../BluetoothPage';
import UpdateDevice from '../../../../../components/device';

const BLUETOOTH_PAGE_PATH = '/dashboard/integration/device/bluetooth';

class BluetoothEditDevicePage extends Component {
  render(props, {}) {
    return (
      <BluetoothPage>
        <UpdateDevice
          {...props}
          integrationName="bluetooth"
          allowModifyFeatures={false}
          previousPage={BLUETOOTH_PAGE_PATH}
        />
      </BluetoothPage>
    );
  }
}

export default connect('user,session,httpClient,currentIntegration,houses', {})(BluetoothEditDevicePage);
