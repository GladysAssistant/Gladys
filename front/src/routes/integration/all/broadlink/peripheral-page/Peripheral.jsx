import { Component } from 'preact';
import { Text } from 'preact-i18n';
import { Link } from 'preact-router';

import DeviceFeatures from '../../../../../components/device/view/DeviceFeatures';

class BroadlinkPeripheralBox extends Component {
  saveDevice = () => {
    this.props.saveDevice(this.props.peripheralIndex);
  };

  updateName = e => {
    this.props.updateDeviceProperty(this.props.peripheralIndex, 'name', e.target.value);
  };

  updateRoom = e => {
    this.props.updateDeviceProperty(this.props.peripheralIndex, 'room_id', e.target.value);
  };

  render({ peripheral, housesWithRooms = [] }) {
    const { device, connectable, name, mac, address, model } = peripheral;
    const editable = connectable && !!device && !device.created_at;
    const alreadyCreated = connectable && !!device && !!device.created_at;
    const remotePeripheral = connectable && !device;
    const deviceName = (device && device.name) || name;

    return (
      <div class="col-md-6">
        <div class="card" data-cy="peripheral-card">
          <div class="card-header">
            <div class="card-title">
              {peripheral.name || <Text id="integration.broadlink.peripheral.noNameLabel" />}
            </div>
          </div>
          <div class="card-body">
            <div class="form-group">
              <label class="form-label" for="name">
                <Text id="integration.broadlink.peripheral.nameLabel" />
              </label>
              <input
                type="text"
                class="form-control"
                data-cy="peripheral-name"
                disabled={!editable}
                value={deviceName}
                onInput={this.updateName}
              />
            </div>
            <div class="form-group">
              <label class="form-label">
                <Text id="integration.broadlink.peripheral.modelLabel" />
              </label>
              <input type="text" class="form-control" data-cy="peripheral-model" disabled value={model} />
            </div>

            {!!device && (
              <div class="form-group">
                <label class="form-label" for="room">
                  <Text id="editDeviceForm.roomLabel" />
                </label>
                <select onChange={this.updateRoom} class="form-control" id="room" disabled={!editable}>
                  <option value="">
                    <Text id="global.emptySelectOption" />
                  </option>
                  {housesWithRooms.map(house => (
                    <optgroup label={house.name}>
                      {house.rooms.map(room => (
                        <option selected={room.id === device.room_id} value={room.id}>
                          {room.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
            )}

            <div class="form-group">
              <label class="form-label" for="ipAddress">
                <Text id="integration.broadlink.peripheral.ipAddressLabel" />
              </label>
              <input type="text" class="form-control" data-cy="peripheral-ip" disabled value={address} />
            </div>
            <div class="form-group">
              <label class="form-label" for="macAddress">
                <Text id="integration.broadlink.peripheral.macAddressLabel" />
              </label>
              <input type="text" class="form-control" data-cy="peripheral-address" disabled value={mac} />
            </div>
            {device && (
              <div class="form-group">
                <label class="form-label">
                  <Text id="integration.broadlink.peripheral.featuresLabel" />
                </label>
                <DeviceFeatures features={device.features} />
              </div>
            )}
            <div class="form-group">
              {!connectable && (
                <button class="btn btn-danger mr-2" data-cy="peripheral-submit" disabled>
                  <Text id="integration.broadlink.peripheral.notConnectable" />
                </button>
              )}
              {editable && (
                <button onClick={this.saveDevice} class="btn btn-success mr-2" data-cy="peripheral-submit">
                  <Text id="integration.broadlink.peripheral.saveButton" />
                </button>
              )}
              {alreadyCreated && (
                <button class="btn btn-primary mr-2" disabled data-cy="peripheral-submit">
                  <Text id="integration.broadlink.peripheral.alreadyCreatedButton" />
                </button>
              )}
              {remotePeripheral && (
                <Link href={`/dashboard/integration/device/broadlink/edit?peripheral=${mac}`}>
                  <button class="btn btn-success mr-2" data-cy="peripheral-submit">
                    <Text id="integration.broadlink.peripheral.createRemoteButton" />
                  </button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default BroadlinkPeripheralBox;
