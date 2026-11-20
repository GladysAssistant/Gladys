import { Text, MarkupText } from 'preact-i18n';
import { Component } from 'preact';
import { Link } from 'preact-router/match';
import cx from 'classnames';
import get from 'get-value';

import { DEVICE_FEATURE_CATEGORIES } from '../../../../../../server/utils/constants';
import { RequestStatus } from '../../../../utils/consts';
import BatteryLevelFeature from '../../../../components/device/view/BatteryLevelFeature';
import DeviceFeatures from '../../../../components/device/view/DeviceFeatures';
import MigrateDeviceButton from '../../../../components/device/migrate/MigrateDeviceButton';
import DeleteDeviceButton from '../../../../components/device/DeleteDeviceButton';

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
    this.setState({ loading: true, tooMuchStatesError: false, statesNumber: undefined, deleteError: false });
    try {
      await this.props.deleteDevice(this.props.device, this.props.deviceIndex);
    } catch (e) {
      const status = get(e, 'response.status');
      const dataMessage = get(e, 'response.data.message');
      if (status === 400 && dataMessage && dataMessage.includes('Too much states')) {
        const statesNumber = new Intl.NumberFormat().format(dataMessage.split(' ')[0]);
        this.setState({ tooMuchStatesError: true, statesNumber });
      } else {
        // said on the card: after the confirmation, a failure must not look like nothing happened
        this.setState({ deleteError: true });
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
  componentWillMount() {
    this.refreshDeviceProperty();
  }

  componentWillUpdate() {
    this.refreshDeviceProperty();
  }

  render(props, { batteryLevel, loading, tooMuchStatesError, statesNumber, deleteError }) {
    return (
      <div class="col-md-4">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">{props.device.name}</h3>
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
                {deleteError && (
                  <div class="alert alert-danger" data-cy="device-delete-error">
                    <Text id="mobileDeviceList.deleteError" />
                  </div>
                )}
                {tooMuchStatesError && (
                  <div class="alert alert-warning">
                    <MarkupText id="device.tooMuchStatesToDelete" fields={{ count: statesNumber }} />
                  </div>
                )}
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
                    <Text id="integration.xiaomi.device.featuresLabel" />
                  </label>
                  <DeviceFeatures features={props.device.features} />
                </div>
                <div class="form-group">
                  <button onClick={this.saveDevice} class="btn btn-success mr-2">
                    <Text id="integration.xiaomi.device.saveButton" />
                  </button>
                  <MigrateDeviceButton device={props.device} onMigrated={props.getXiaomiDevices} />
                  <DeleteDeviceButton device={props.device} onDelete={this.deleteDevice} class="btn btn-danger">
                    <Text id="integration.xiaomi.device.deleteButton" />
                  </DeleteDeviceButton>
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
