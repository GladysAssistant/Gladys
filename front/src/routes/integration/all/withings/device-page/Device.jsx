import { Text, Localizer } from 'preact-i18n';
import { Component } from 'preact';
import cx from 'classnames';
import get from 'get-value';
import dayjs from 'dayjs';
import { Link } from 'preact-router';
import relativeTime from 'dayjs/plugin/relativeTime';
import { WithingsDeviceImgByModel } from './withingsConsts';
import BatteryLevelFeature from '../../../../../components/device/view/BatteryLevelFeature';
import style from './style.css';

dayjs.extend(relativeTime);

import { DEVICE_FEATURE_CATEGORIES } from '../../../../../../../server/utils/constants';
import { RequestStatus } from '../../../../../utils/consts';
import DeviceFeatures from '../../../../../components/device/view/DeviceFeatures';

class WithingsDeviceBox extends Component {
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
      if (this.props.settingsPage) {
        await this.props.deleteDevice(this.props.device, null);
      } else {
        await this.props.deleteDevice(this.props.device, this.props.deviceIndex);
      }
    } catch (e) {
      this.setState({ error: RequestStatus.Error });
    }
    this.setState({ loading: false });
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

  render(props, { batteryLevel, mostRecentValueAt, loading }) {
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
              <div class="card-body">
                <div class="form-group">
                  {WithingsDeviceImgByModel && (
                    <Localizer>
                      <img
                        class={cx('card-img-top', style.imgBox)}
                        src={`/assets/images/withings/${WithingsDeviceImgByModel[props.device.model]}`}
                        alt={<Text id="global.logoAlt" />}
                      />
                    </Localizer>
                  )}
                </div>
                {!props.settingsPage && (
                  <div class="form-group">
                    <label>
                      <Text id="integration.withings.device.roomLabel" />
                    </label>
                    <select onChange={this.updateRoom} class="form-control">
                      <option value="">
                        <Text id="global.emptySelectOption" />
                      </option>
                      {props.houses &&
                        props.houses.map(house => (
                          <optgroup label={house.name}>
                            {house.rooms.map(room => (
                              <option selected={room.id === props.device.room_id} value={room.id}>
                                {room.name}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                    </select>
                  </div>
                )}
                <div class="form-group">
                  <label>
                    <Text id="integration.withings.device.featuresLabel" />
                  </label>
                  <DeviceFeatures features={props.device.features} />
                  {!props.settingsPage && (
                    <p class="mt-4">
                      {mostRecentValueAt ? (
                        <Text
                          id="integration.withings.device.mostRecentValueAt"
                          fields={{
                            mostRecentValueAt: dayjs(mostRecentValueAt)
                              .locale(props.user.language)
                              .fromNow()
                          }}
                        />
                      ) : (
                        <Text id="integration.withings.device.noValueReceived" />
                      )}
                    </p>
                  )}
                </div>
                <div class="form-group">
                  {props.settingsPage && props.device.inDB && (
                    <button onClick={this.deleteDevice} class="btn btn-danger mr-2">
                      <Text id="integration.withings.device.deleteDeviceInGladys" />
                    </button>
                  )}
                  {props.settingsPage && !props.device.inDB && (
                    <button onClick={this.saveDevice} class="btn btn-success mr-2">
                      <Text id="integration.withings.device.createDeviceInGladys" />
                    </button>
                  )}
                  {!props.settingsPage && (
                    <>
                      <button onClick={this.saveDevice} class="btn btn-success mr-2">
                        <Text id="integration.withings.device.saveButton" />
                      </button>
                      <button onClick={this.deleteDevice} class="btn btn-danger mr-2">
                        <Text id="integration.withings.device.deleteButton" />
                      </button>
                      <Link href={`/dashboard/integration/health/withings/device/${props.device.selector}`}>
                        <button class="btn btn-secondary float-right">
                          <Text id="integration.withings.device.editButton" />
                        </button>
                      </Link>
                    </>
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

export default WithingsDeviceBox;
