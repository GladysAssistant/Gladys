import { Text } from 'preact-i18n';
import { Component } from 'preact';
import { Link } from 'preact-router';

import { RequestStatus } from '../../../../../utils/consts';
import { PARAMS } from '../../../../../../../server/services/bluetooth/lib/utils/bluetooth.constants';

import BluetoothPeripheralFeatures from './BluetoothPeripheralFeatures';

class BluetoothPeripheral extends Component {
  scan = () => {
    this.props.scan(this.props.peripheral.selector);
  };

  createDevice = async () => {
    this.setState({ loading: true });
    try {
      await this.props.createDevice(this.props.node);
      this.setState({ deviceCreated: true });
    } catch (e) {
      this.setState({ error: RequestStatus.Error });
    }
    this.setState({ loading: false });
  };

  render({ peripheral, bluetoothStatus }, { error, deviceCreated }) {
    const params = peripheral.params || [];
    const manufacturerParam = params.find(p => p.name === PARAMS.MANUFACTURER);
    const manufacturerValue = (manufacturerParam || { value: null }).value;

    return (
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">{peripheral.name}</h3>
          </div>
          {error && (
            <div class="alert alert-danger">
              <Text id="integration.bluetooth.setup.createDeviceError" />
            </div>
          )}
          {deviceCreated && (
            <div class="alert alert-success">
              <Text id="integration.bluetooth.setup.deviceCreatedSuccess" />
            </div>
          )}
          <div class="card-body">
            <div class="form-group">
              <label>
                <Text id="integration.bluetooth.device.externalIdLabel" />
              </label>
              <input type="text" class="form-control" disabled value={peripheral.external_id} />
            </div>
            <div class="form-group">
              <label>
                <Text id="integration.bluetooth.device.manufacturerLabel" />
              </label>
              <input type="text" class="form-control" disabled value={manufacturerValue} />
            </div>
            <div class="form-group">
              <label>
                <Text id="integration.bluetooth.device.modelLabel" />
              </label>
              <input type="text" class="form-control" disabled value={peripheral.model} />
            </div>
            <BluetoothPeripheralFeatures peripheral={peripheral} bluetoothStatus={bluetoothStatus} scan={this.scan} />
            <div class="form-group">
              <Link href={'/dashboard/integration/device/bluetooth/setup/' + peripheral.selector}>
                {!peripheral.id && (
                  <button class="btn btn-success">
                    <Text id="integration.bluetooth.setup.createDeviceInGladys" />
                  </button>
                )}
                {peripheral.id && (
                  <button class="btn btn-primary">
                    <Text id="integration.bluetooth.setup.updateDeviceInGladys" />
                  </button>
                )}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default BluetoothPeripheral;
