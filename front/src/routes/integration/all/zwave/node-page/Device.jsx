import { Text, Localizer, MarkupText } from 'preact-i18n';
import { Component } from 'preact';
import cx from 'classnames';
import get from 'get-value';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

import { DEVICE_FEATURE_CATEGORIES } from '../../../../../../../server/utils/constants';
import { RequestStatus } from '../../../../../utils/consts';
import BatteryLevelFeature from '../../../../../components/device/view/BatteryLevelFeature';
import DeviceFeatures from '../../../../../components/device/view/DeviceFeatures';

class ZWaveDeviceBox extends Component {
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
    this.setState({ loading: true, tooMuchStatesError: false, statesNumber: undefined });
    try {
      await this.props.deleteDevice(this.props.device, this.props.deviceIndex);
    } catch (e) {
      const status = get(e, 'response.status');
      const dataMessage = get(e, 'response.data.message');
      if (status === 400 && dataMessage && dataMessage.includes('Too much states')) {
        const statesNumber = new Intl.NumberFormat().format(dataMessage.split(' ')[0]);
        this.setState({ tooMuchStatesError: true, statesNumber });
      } else {
        this.setState({ error: RequestStatus.Error });
      }
    }
    this.setState({ loading: false });
  };
  updateName = e => {
    this.props.updateDeviceProperty(this.props.deviceIndex, 'name', e.target.value);
  };
  updateRoom = e => {
    this.props.updateDeviceProperty(this.props.deviceIndex, 'room_id', e.target.value);
  };
  convertDeviceToMqtt = async () => {
    this.setState({ loading: true });
    try {
      await this.props.convertToMqtt(this.props.deviceIndex);
    } catch (e) {
      console.error(e);
      this.setState({ error: RequestStatus.Error });
    }
    this.setState({ loading: false });
  };
  componentWillMount() {
    this.refreshDeviceProperty();
  }

  componentWillUpdate() {
    this.refreshDeviceProperty();
  }

  render(props, { batteryLevel, mostRecentValueAt, loading, tooMuchStatesError, statesNumber }) {
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
                {tooMuchStatesError && (
                  <div class="alert alert-warning">
                    <MarkupText id="device.tooMuchStatesToDelete" fields={{ count: statesNumber }} />
                  </div>
                )}
                <div class="form-group">
                  <label>
                    <Text id="integration.zwave.device.nameLabel" />
                  </label>
                  <Localizer>
                    <input
                      type="text"
                      value={props.device.name}
                      onInput={this.updateName}
                      class="form-control"
                      placeholder={<Text id="integration.zwave.device.nameLabel" />}
                    />
                  </Localizer>
                </div>
                <div class="form-group">
                  <label>
                    <Text id="integration.zwave.device.roomLabel" />
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
                    <Text id="integration.zwave.device.featuresLabel" />
                  </label>
                  <DeviceFeatures features={props.device.features} />
                  <p class="mt-2">
                    {mostRecentValueAt ? (
                      <Text
                        id="integration.zwave.device.mostRecentValueAt"
                        fields={{
                          mostRecentValueAt: dayjs(mostRecentValueAt)
                            .locale(props.user.language)
                            .fromNow()
                        }}
                      />
                    ) : (
                      <Text id="integration.zwave.device.noValueReceived" />
                    )}
                  </p>
                </div>
                <div class="form-group">
                  <button onClick={this.deleteDevice} class="btn btn-danger mr-2">
                    <Text id="integration.zwave.device.deleteButton" />
                  </button>
                  <button onClick={this.convertDeviceToMqtt} class="btn btn-warning">
                    <Text id="integration.zwave.device.convertToMqtt" />
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

export default ZWaveDeviceBox;
