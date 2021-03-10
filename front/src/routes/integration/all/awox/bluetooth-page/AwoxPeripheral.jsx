import { Text, Localizer } from 'preact-i18n';
import { Component } from 'preact';
import { Link } from 'preact-router';
import { connect } from 'unistore/preact';
import get from 'get-value';

import { DEVICE_PARAMS } from '../../../../../../../server/services/awox/lib/utils/awox.constants';
import actions from '../../bluetooth/setup-page/actions';
import BluetoothPeripheralFeatures from '../../bluetooth/setup-page/BluetoothPeripheralFeatures';

@connect('', actions)
class AwoxPeripheral extends Component {
  scan = () => {
    this.props.scan(this.props.peripheral.selector);
  };

  render({ peripheral, bluetoothStatus, currentIntegration }) {
    const params = peripheral.params || [];
    const awoxTypeParam = params.find(p => p.name === DEVICE_PARAMS.DEVICE_TYPE);
    const awoxType = (awoxTypeParam || { value: '' }).value;
    const peripheralService = get(peripheral, 'service_id');
    const awoxDevice = !peripheralService || peripheralService === currentIntegration.id;

    return (
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">{peripheral.name}</h3>
          </div>
          <div class="card-body">
            <div class="form-group">
              <label class="form-label">
                <Text id="integration.awox.device.externalIdLabel" />
              </label>
              <input type="text" class="form-control" disabled value={peripheral.external_id} />
            </div>
            <div class="form-group">
              <label class="form-label">
                <Text id="integration.awox.device.awoxTypeLabel" />
              </label>
              <Localizer>
                <input
                  type="text"
                  class="form-control"
                  disabled
                  value={<Text id={`integration.awox.device.awoxTypes.${awoxType}`} />}
                />
              </Localizer>
            </div>
            <BluetoothPeripheralFeatures
              device={peripheral}
              bluetoothStatus={bluetoothStatus}
              scan={this.scan}
              bluetoothDevice
            />
            <div class="form-group">
              {awoxDevice && (
                <Link href={`/dashboard/integration/device/awox/bluetooth/${peripheral.selector}`}>
                  {!peripheral.id && (
                    <button class="btn btn-success">
                      <Text id="integration.awox.setup.createDeviceInGladys" />
                    </button>
                  )}
                  {peripheral.id && (
                    <button class="btn btn-primary">
                      <Text id="integration.awox.setup.updateDeviceInGladys" />
                    </button>
                  )}
                </Link>
              )}

              {!awoxDevice && (
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

export default AwoxPeripheral;
