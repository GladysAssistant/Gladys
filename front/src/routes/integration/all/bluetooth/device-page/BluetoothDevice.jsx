import { Text, Localizer } from 'preact-i18n';
import { Component } from 'preact';
import cx from 'classnames';
import get from 'get-value';
import { Link } from 'preact-router';

import { DEVICE_FEATURE_CATEGORIES } from '../../../../../../../server/utils/constants';
import { RequestStatus, DeviceFeatureCategoriesIcon } from '../../../../../utils/consts';

import style from '../style.css';

class BluetoothDevice extends Component {
  refreshDeviceProperty = () => {
    if (!this.props.device.features) {
      return null;
    }
    const batteryLevelDeviceFeature = this.props.device.features.find(
      deviceFeature => deviceFeature.category === DEVICE_FEATURE_CATEGORIES.BATTERY
    );
    const batteryLevel = get(batteryLevelDeviceFeature, 'last_value');
    this.setState({
      batteryLevel
    });
  };
  saveDevice = async () => {
    this.setState({ loading: true });
    try {
      await this.props.saveDevice(this.props.device);
    } catch (e) {
      this.setState({ error: RequestStatus.Error });
    }
    this.setState({ loading: false });
  };
  deleteDevice = async () => {
    this.setState({ loading: true });
    try {
      await this.props.deleteDevice(this.props.device, this.props.deviceIndex);
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
  componentWillMount() {
    this.refreshDeviceProperty();
  }

  componentWillUpdate() {
    this.refreshDeviceProperty();
  }

  render({ device, houses, ...props }, { batteryLevel, loading }) {
    return (
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">
            {device.name}
            {batteryLevel && (
              <div class="page-options d-flex">
                <div class="tag tag-green">
                  <Text id="global.percentValue" fields={{ value: batteryLevel }} />
                  <span class="tag-addon">
                    <i class="fe fe-battery" />
                  </span>
                </div>
              </div>
            )}
          </div>
          <div
            class={cx('dimmer', {
              active: loading
            })}
          >
            <div class="loader" />
            <div class="dimmer-content">
              <div class="card-body">
                <div class="form-group">
                  <label>
                    <Text id="integration.bluetooth.device.nameLabel" />
                  </label>
                  <Localizer>
                    <input
                      type="text"
                      value={device.name}
                      onInput={this.updateName}
                      class="form-control"
                      placeholder={<Text id="integration.bluetooth.device.namePlaceholder" />}
                    />
                  </Localizer>
                </div>
                <div class="form-group">
                  <label>
                    <Text id="integration.bluetooth.device.roomLabel" />
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
                  <label>
                    <Text id="integration.bluetooth.device.featuresLabel" />
                  </label>
                  {device.features && (
                    <div class="tags">
                      {device.features.map(feature => (
                        <span class="tag">
                          <Text id={`deviceFeatureCategory.${feature.category}.${feature.type}`} />
                          <div class="tag-addon">
                            <i
                              class={`fe fe-${get(DeviceFeatureCategoriesIcon, `${feature.category}.${feature.type}`)}`}
                            />
                          </div>
                        </span>
                      ))}
                    </div>
                  )}
                  {(!device.features || device.features.length === 0) && (
                    <div class={cx('text-center', 'font-italic', 'mt-3', style.featureListBody)}>
                      <Text id="integration.bluetooth.device.noFeatureDiscovered" />
                    </div>
                  )}
                </div>
                <div class="form-group">
                  <button onClick={this.saveDevice} class="btn btn-success mr-2">
                    <Text id="integration.bluetooth.device.saveButton" />
                  </button>
                  <button onClick={this.deleteDevice} class="btn btn-danger">
                    <Text id="integration.bluetooth.device.deleteButton" />
                  </button>
                  <Link href={`/dashboard/integration/device/bluetooth/${device.selector}`}>
                    <button class="btn btn-secondary float-right">
                      <Text id="integration.bluetooth.device.editButton" />
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default BluetoothDevice;
