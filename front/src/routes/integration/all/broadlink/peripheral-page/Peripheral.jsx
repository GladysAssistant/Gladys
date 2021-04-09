import { Component } from 'preact';
import { Text } from 'preact-i18n';

import DevicePeripheralForm from './DevicePeripheralForm';
import HubPeripheralForm from './HubPeripheralForm';

class BroadlinkPeripheralBox extends Component {
  saveDevice = () => {
    this.props.saveDevice(this.props.peripheralIndex);
  };

  updateName = e => {
    this.props.updateDeviceProperty(this.props.peripheralIndex, 'name', e.target.value);
  };

  render({ peripheral }) {
    return (
      <div class="col-md-6">
        <div class="card" data-cy="peripheral-card">
          <div class="card-header">
            <div class="card-title">
              {peripheral.name || <Text id="integration.broadlink.peripheral.noNameLabel" />}
            </div>
          </div>
          <div class="card-body">
            {!peripheral.device && <HubPeripheralForm peripheral={peripheral} />}
            {peripheral.device && (
              <DevicePeripheralForm peripheral={peripheral} updateName={this.updateName} saveDevice={this.saveDevice} />
            )}
          </div>
        </div>
      </div>
    );
  }
}

export default BroadlinkPeripheralBox;
