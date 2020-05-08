import { Text } from 'preact-i18n';
import { Component } from 'preact';
import { Link } from 'preact-router/match';
import cx from 'classnames';
import get from 'get-value';
import { DEVICE_FEATURE_CATEGORIES } from '../../../../../../server/utils/constants';
import { RequestStatus, DeviceFeatureCategoriesIcon } from '../../../../utils/consts';
import RoomSelector from '../../../../components/house/RoomSelector';

class XiaomiDeviceBox extends Component {
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
  getGatewayIp = () => {
    if (!this.props.device.params) {
      return '';
    }
    const gatewayIpParam = this.props.device.params.find(param => param.name === 'GATEWAY_IP');
    if (gatewayIpParam) {
      return gatewayIpParam.value;
    }
    return '';
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
  updateRoom = room => {
    this.props.updateDeviceProperty(this.props.deviceIndex, 'room_id', get(room, 'id'));
  };
  componentWillMount() {
    this.refreshDeviceProperty();
  }

  componentWillUpdate() {
    this.refreshDeviceProperty();
  }

  render(props, { batteryLevel, loading, error }) {
    return (
      <div class="col-md-4">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">{props.device.name}</h3>
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
                    <Text id="integration.xiaomi.device.sidLabel" />
                  </label>
                  <input type="text" value={props.device.external_id.split(':')[1]} class="form-control" disabled />
                </div>
                {props.device.model === 'xiaomi-gateway' && (
                  <div class="form-group">
                    <label>
                      <Text id="integration.xiaomi.device.ipLabel" />
                    </label>
                    <input type="text" value={this.getGatewayIp()} class="form-control" disabled />
                  </div>
                )}
                <div class="form-group">
                  <label>
                    <Text id="integration.xiaomi.device.roomLabel" />
                  </label>
                  <RoomSelector
                    houses={props.houses}
                    uniqueKey="id"
                    selectedRoom={props.device.room_id}
                    updateRoomSelection={this.updateRoom}
                    clearable
                  />
                </div>
                <div class="form-group">
                  <label>
                    <Text id="integration.xiaomi.device.featuresLabel" />
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
                      <Text id="integration.xiaomi.device.noFeatures" />
                    )}
                  </div>
                </div>
                <div class="form-group">
                  <button onClick={this.saveDevice} class="btn btn-success mr-2">
                    <Text id="integration.xiaomi.device.saveButton" />
                  </button>
                  <button onClick={this.deleteDevice} class="btn btn-danger">
                    <Text id="integration.xiaomi.device.deleteButton" />
                  </button>
                  <Link href={`/dashboard/integration/device/xiaomi/edit/${props.device.selector}`}>
                    <button class="btn btn-secondary float-right">
                      <Text id="integration.xiaomi.device.editButton" />
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

export default XiaomiDeviceBox;
