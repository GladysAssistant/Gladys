import { Text } from 'preact-i18n';
import { Component } from 'preact';
import { Link } from 'preact-router';
import get from 'get-value';

import { PARAMS } from '../../../../../../../server/services/bluetooth/lib/utils/bluetooth.constants';

import BluetoothPeripheralFeatures from './BluetoothPeripheralFeatures';

class BluetoothPeripheral extends Component {
  scan = () => {
    this.props.scan(this.props.peripheral.selector);
  };

  render({ peripheral, currentIntegration }) {
    const params = peripheral.params || [];
    const manufacturerParam = params.find(p => p.name === PARAMS.MANUFACTURER);
    const manufacturerValue = (manufacturerParam || { value: null }).value;
    const peripheralService = get(peripheral, 'service_id');
    const bluetoothDevice = !peripheralService || peripheralService === currentIntegration.id;

    return (
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">{peripheral.name}</h3>
          </div>
          <div class="card-body">
            <div class="form-group">
              <label class="form-label">
                <Text id="integration.bluetooth.device.externalIdLabel" />
              </label>
              <input type="text" class="form-control" disabled value={peripheral.external_id} />
            </div>
            <div class="form-group">
              <label class="form-label">
                <Text id="integration.bluetooth.device.manufacturerLabel" />
              </label>
              <input type="text" class="form-control" disabled value={manufacturerValue} />
            </div>
            <div class="form-group">
              <label class="form-label">
                <Text id="integration.bluetooth.device.modelLabel" />
              </label>
              <input type="text" class="form-control" disabled value={peripheral.model} />
            </div>
            <BluetoothPeripheralFeatures device={peripheral} />
            <div class="form-group">
              {bluetoothDevice && (
                <Link href={`/dashboard/integration/device/bluetooth/setup/${peripheral.selector}`}>
                  {!peripheralService && (
                    <button class="btn btn-success">
                      <Text id="integration.bluetooth.discover.createDeviceInGladys" />
                    </button>
                  )}
                  {peripheralService && (
                    <button class="btn btn-primary">
                      <Text id="integration.bluetooth.discover.updateDeviceInGladys" />
                    </button>
                  )}
                </Link>
              )}
              {!bluetoothDevice && (
                <button class="btn btn-outline-secondary" disabled>
                  <Text
                    id="integration.bluetooth.discover.notManagedByBluteoothButton"
                    fields={{ service: peripheral.service.name }}
                  />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default BluetoothPeripheral;
