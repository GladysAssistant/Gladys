import { Text } from 'preact-i18n';
import { Component } from 'preact';

import { RequestStatus } from '../../../../../utils/consts';
import { Link } from 'preact-router';

class BluetoothNode extends Component {
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

  render(props, { error, deviceCreated }) {
    return (
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">{props.peripheral.name || props.peripheral.uuid}</h3>
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
                <Text id="integration.bluetooth.setup.rssiLabel" />
              </label>
              <input type="text" class="form-control" disabled value={props.peripheral.rssi} />
            </div>
            <div class="form-group">
              <label>
                <Text id="integration.bluetooth.setup.addressLabel" />
              </label>
              <input type="text" class="form-control" disabled value={props.peripheral.address} />
            </div>
            <div class="form-group">
              <label>
                <Text id="integration.bluetooth.setup.lastSeenLabel" />
              </label>
              <input
                type="text"
                class="form-control"
                disabled
                value={new Date(props.peripheral.lastSeen).toLocaleTimeString()}
              />
            </div>
            <div class="form-group">
              <Link href={'/dashboard/integration/device/bluetooth/setup/' + props.peripheral.uuid}>
                <button class="btn btn-success" disabled={!props.peripheral.connectable}>
                  <Text id="integration.bluetooth.setup.createDeviceInGladys" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default BluetoothNode;
