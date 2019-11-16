import { Text } from 'preact-i18n';
import { Component } from 'preact';
import { Link } from 'preact-router/match';
import cx from 'classnames';
import get from 'get-value';
import { DEVICE_FEATURE_CATEGORIES } from '../../../../../../server/utils/constants';
import { RequestStatus, DeviceFeatureCategoriesIcon } from '../../../../utils/consts';

class MagicDevicesDeviceBox extends Component {

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
    //this.refreshDeviceProperty();
  }

  componentWillUpdate() {
    //this.refreshDeviceProperty();
  }

  render(props, { loading, error }) {
    return (
      <div class="col-md-4">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">{props.device.name}</h3>
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
                <div class="form-group">
                  <label>
                    <Text id="integration.magicDevices.device.roomLabel" />
                  </label>
                  <select onChange={this.updateRoom} class="form-control">
                    <option value="">-------</option>
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
                    <Text id="integration.magicDevices.device.featuresLabel" />
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
                      <Text id="integration.magicDevices.device.noFeatures" />
                    )}
                  </div>
                </div>
                <div class="form-group">
                  <button onClick={this.saveDevice} class="btn btn-success mr-2">
                    <Text id="integration.magicDevices.device.saveButton" />
                  </button>
                  <button onClick={this.deleteDevice} class="btn btn-danger">
                    <Text id="integration.magicDevices.device.deleteButton" />
                  </button>
                  <Link href={`/dashboard/integration/device/magicDevices/edit/${props.device.selector}`}>
                    <button class="btn btn-secondary float-right">
                      <Text id="integration.magicDevices.device.editButton" />
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

export default MagicDevicesDeviceBox;
