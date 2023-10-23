import { Text, Localizer } from 'preact-i18n';
import { Component } from 'preact';
import cx from 'classnames';
import get from 'get-value';
import { Link } from 'preact-router/match';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

import { DEVICE_FEATURE_CATEGORIES } from '../../../../../../../server/utils/constants';
import { RequestStatus } from '../../../../../utils/consts';
import BatteryLevelFeature from '../../../../../components/device/view/BatteryLevelFeature';
import DeviceFeatures from '../../../../../components/device/view/DeviceFeatures';

class Device extends Component {
  refreshDeviceProperty = () => {
    if (!this.props.device.features) {
      return null;
    }
    const batteryLevelDeviceFeature = this.props.device.features.find(
      deviceFeature => deviceFeature.category === DEVICE_FEATURE_CATEGORIES.BATTERY
    );
    const batteryLevel = get(batteryLevelDeviceFeature, 'last_value');
    let mostRecentValueAt = null;
    this.props.device.features.forEach(feature => {
      if (feature.last_value_changed && new Date(feature.last_value_changed) > mostRecentValueAt) {
        mostRecentValueAt = new Date(feature.last_value_changed);
      }
    });
    this.setState({
      batteryLevel,
      mostRecentValueAt
    });
  };

  saveDevice = async () => {
    this.setState({ loading: true, error: undefined });
    try {
      await this.props.saveDevice(this.props.device);
      this.setState({ deviceUpdated: true });
    } catch (e) {
      const status = get(e, 'response.status');
      if (status === 409) {
        this.setState({ error: RequestStatus.ConflictError });
      } else {
        this.setState({ error: RequestStatus.Error });
      }
    }
    this.setState({ loading: false });
  };

  deleteDevice = async () => {
    this.setState({ loading: true, error: undefined });
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

  render(props, { batteryLevel, mostRecentValueAt, loading, error, deviceUpdated }) {
    return (
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">
            {props.device.name}
            {batteryLevel && (
              <div class="page-options d-flex">
                <BatteryLevelFeature batteryLevel={batteryLevel} />
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
              {error === RequestStatus.Error && (
                <div class="alert alert-danger">
                  <Text id="integration.zwavejsui.device.updateDeviceError" />
                </div>
              )}
              {error === RequestStatus.ConflictError && (
                <div class="alert alert-danger">
                  <Text id="integration.zwavejsui.device.conflictError" />
                </div>
              )}
              {deviceUpdated && (
                <div class="alert alert-success">
                  <Text id="integration.zwavejsui.device.deviceUpdatedSuccess" />
                </div>
              )}
              <div class="card-body">
                <div class="form-group">
                  <label>
                    <Text id="integration.zwavejsui.device.nameLabel" />
                  </label>
                  <Localizer>
                    <input
                      type="text"
                      value={props.device.name}
                      onInput={this.updateName}
                      class="form-control"
                      placeholder={<Text id="integration.zwavejsui.device.nameLabel" />}
                    />
                  </Localizer>
                </div>
                <div class="form-group">
                  <label>
                    <Text id="integration.zwavejsui.device.roomLabel" />
                  </label>
                  <select onChange={this.updateRoom} class="form-control">
                    <option value="">
                      <Text id="global.emptySelectOption" />
                    </option>
                    {props.houses &&
                      props.houses.map(house => (
                        <optgroup label={house.name}>
                          {house.rooms &&
                            house.rooms.map(room => (
                              <option selected={room.id === props.device.room_id} value={room.id}>
                                {room.name}
                              </option>
                            ))}
                        </optgroup>
                      ))}
                  </select>
                </div>
                <div class="form-group">
                  <label>
                    <Text id="integration.zwavejsui.device.featuresLabel" />
                  </label>
                  <DeviceFeatures features={props.device.features} />
                  <p class="mt-4">
                    {mostRecentValueAt ? (
                      <Text
                        id="integration.zwavejsui.device.mostRecentValueAt"
                        fields={{
                          mostRecentValueAt: dayjs(mostRecentValueAt)
                            .locale(props.user.language)
                            .fromNow()
                        }}
                      />
                    ) : (
                      <Text id="integration.zwavejsui.device.noValueReceived" />
                    )}
                  </p>
                </div>
                <div class="form-group">
                  <button onClick={this.saveDevice} class="btn btn-success mr-2">
                    <Text id="integration.zwavejsui.device.saveButton" />
                  </button>
                  <button onClick={this.deleteDevice} class="btn btn-danger">
                    <Text id="integration.zwavejsui.device.deleteButton" />
                  </button>
                  <Link href={`/dashboard/integration/device/zwave-js-ui/edit/${props.device.selector}`}>
                    <button class="btn btn-secondary float-right">
                      <Text id="integration.zwavejsui.device.editButton" />
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

export default Device;
