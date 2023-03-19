import { Text, Localizer } from 'preact-i18n';
import { Component } from 'preact';
import cx from 'classnames';
import get from 'get-value';

import { RequestStatus } from '../../../../../utils/consts';
import DeviceFeatures from '../../../../../components/device/view/DeviceFeatures';
import { PARAMS } from '../../../../../../../server/services/lan-manager/lib/lan-manager.constants';

class LANManagerDiscoverDevice extends Component {
  saveDevice = async () => {
    this.setState({ loading: true });
    try {
      await this.props.saveDevice(this.props.deviceIndex);
    } catch (e) {
      this.setState({ error: RequestStatus.Error });
    }
    this.setState({ loading: false });
  };
  updateName = e => {
    this.props.updateDeviceProperty(this.props.deviceIndex, 'name', e.target.value);
  };
  updateRoom = e => {
    this.props.updateDeviceProperty(this.props.deviceIndex, 'room_id', e.target.value);
  };

  render({ device, houses }, { loading }) {
    const manufacturer = device.params.find(param => param.name === PARAMS.MANUFACTURER);
    const macAddress = device.params.find(param => param.name === PARAMS.MAC);
    const orginalName = device.params.find(param => param.name === PARAMS.NAME);

    return (
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">{device.name}</div>
          <div
            class={cx('dimmer', {
              active: loading
            })}
          >
            <div class="loader" />
            <div class="dimmer-content">
              <div class="card-body">
                <div class="form-group">
                  <label class="form-label">
                    <Text id="editDeviceForm.nameLabel" />
                  </label>
                  <Localizer>
                    <input
                      type="text"
                      value={device.name}
                      onInput={this.updateName}
                      class={cx('form-control', {
                        'is-invalid': !device.name || device.name === ''
                      })}
                      placeholder={<Text id="editDeviceForm.namePlaceholder" />}
                    />
                  </Localizer>
                </div>
                <div class="form-group">
                  <label class="form-label">
                    <Text id="editDeviceForm.roomLabel" />
                  </label>
                  <select onChange={this.updateRoom} class="form-control">
                    <option value="">
                      <Text id="global.emptySelectOption" />
                    </option>
                    {houses &&
                      houses.map(house => (
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
                <div class="form-group">
                  <label class="form-label">
                    <Text id="integration.lanManager.device.manufacturerLabel" />
                  </label>
                  <Localizer>
                    <input
                      type="text"
                      value={get(manufacturer, 'value', { default: '' })}
                      class="form-control"
                      disabled
                    />
                  </Localizer>
                </div>
                <div class="form-group">
                  <label class="form-label">
                    <Text id="integration.lanManager.device.ipAddressLabel" />
                  </label>
                  <Localizer>
                    <input type="text" value={get(device, 'ip', { default: '' })} class="form-control" disabled />
                  </Localizer>
                </div>
                <div class="form-group">
                  <label class="form-label">
                    <Text id="integration.lanManager.device.macAddressLabel" />
                  </label>
                  <Localizer>
                    <input type="text" value={get(macAddress, 'value')} class="form-control" disabled />
                  </Localizer>
                </div>
                <div class="form-group">
                  <label class="form-label">
                    <Text id="integration.lanManager.device.originalNameLabel" />
                  </label>
                  <Localizer>
                    <input
                      type="text"
                      value={get(orginalName, 'value', { default: '' })}
                      class="form-control"
                      disabled
                    />
                  </Localizer>
                </div>
                <div class="form-group">
                  <label class="form-label">
                    <Text id="editDeviceForm.featuresLabel" />
                  </label>
                  <DeviceFeatures features={device.features} />
                </div>
                <div class="form-group">
                  {device.created_at && (
                    <button class="btn btn-primary mr-2" disabled="true">
                      <Text id="integration.lanManager.discover.alreadyCreatedButton" />
                    </button>
                  )}

                  {!device.created_at && (
                    <button
                      onClick={this.saveDevice}
                      class="btn btn-success mr-2"
                      disabled={!device.name || device.name === ''}
                    >
                      <Text id="editDeviceForm.saveButton" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default LANManagerDiscoverDevice;
