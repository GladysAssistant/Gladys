import { Text, Localizer } from 'preact-i18n';
import { Component } from 'preact';
import cx from 'classnames';
import get from 'get-value';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

import { DEVICE_FEATURE_TYPES } from '../../../../../../../server/utils/constants';
import { RequestStatus, DeviceFeatureCategoriesIcon } from '../../../../../utils/consts';

class WithingsDeviceBox extends Component {
  refreshDeviceProperty = () => {
    if (!this.props.device.features) {
      return null;
    }
    const batteryLevelDeviceFeature = this.props.device.features.find(
      deviceFeature => deviceFeature.type === DEVICE_FEATURE_TYPES.SENSOR.INTEGER
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
  updateRoom = e => {
    this.props.updateDeviceProperty(this.props.deviceIndex, 'room_id', e.target.value);
  };
  componentWillMount() {
    this.refreshDeviceProperty();
  }

  componentWillUpdate() {
    this.refreshDeviceProperty();
  }

  render(props, { batteryLevel, mostRecentValueAt, loading, error }) {
    return (
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">
            {props.device.name}
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
                  {props.withingsImgMap && (
                    <Localizer>
                      <img
                        class="card-img-top"
                        src={`/assets/images/withings/${props.withingsImgMap.get(props.device.name)}`}
                        alt={<Text id="global.logoAlt" />}
                      />
                    </Localizer>
                  )}
                </div>
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
                <div class="form-group">
                  <label>
                    <Text id="integration.withings.device.featuresLabel" />
                  </label>
                  <div class="tags">
                    {props.device &&
                      props.device.features &&
                      props.device.features.map(feature => (
                        <span class="tag">
                          <Text id={`deviceFeatureCategory.${feature.category}.${feature.type}`} />
                          <div class="tag-addon">
                            <i
                              class={`fe fe-${get(DeviceFeatureCategoriesIcon, `${feature.category}.${feature.type}`)}`}
                            />
                          </div>
                        </span>
                      ))}
                    {(!props.device.features || props.device.features.length === 0) && (
                      <Text id="integration.withings.device.noFeatures" />
                    )}
                  </div>
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
                </div>
                <div class="form-group">
                  <button onClick={this.saveDevice} class="btn btn-success mr-2">
                    <Text id="integration.withings.device.saveButton" />
                  </button>
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
