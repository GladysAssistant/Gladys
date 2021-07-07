import { Text, Localizer } from 'preact-i18n';
import { Component } from 'preact';
import cx from 'classnames';
import get from 'get-value';
import { Link } from 'preact-router/match';
import { DeviceFeatureCategoriesIcon, RequestStatus } from '../../../../../utils/consts';

class RemoteBox extends Component {
  saveDevice = async () => {
    this.setState({
      loading: true
    });
    try {
      await this.props.saveDevice(this.props.device, this.props.deviceIndex);
      this.setState({
        saveError: null
      });
    } catch (e) {
      this.setState({
        saveError: RequestStatus.Error
      });
    }
    this.setState({
      loading: false
    });
  };

  deleteDevice = async () => {
    this.setState({
      loading: true
    });
    try {
      await this.props.deleteDevice(this.props.device, this.props.deviceIndex);
    } catch (e) {
      this.setState({
        error: RequestStatus.Error
      });
    }
    this.setState({
      loading: false
    });
  };

  updateDeviceName = e => {
    this.props.updateDeviceProperty(this.props.deviceIndex, 'name', e.target.value);
  };

  updateDeviceRoom = e => {
    this.props.updateDeviceProperty(this.props.deviceIndex, 'room_id', e.target.value);
  };

  render({ deviceIndex, device, houses = [] }, { loading, saveError }) {
    const isRemote = device.model;

    return (
      <div class="col-md-6">
        <div class="card">
          <div
            class={cx('dimmer', {
              active: loading
            })}
          >
            <div class="loader" />
            <div class="dimmer-content">
              <div class="card-body">
                {saveError && (
                  <div class="alert alert-danger">
                    <Text id="integration.broadlink.remote.saveError" />
                  </div>
                )}
                <div class="form-group">
                  <label class="form-label" for={`name_${deviceIndex}`}>
                    <Text id="integration.broadlink.remote.nameLabel" />
                  </label>
                  <Localizer>
                    <input
                      type="text"
                      value={device.name}
                      onInput={this.updateDeviceName}
                      class="form-control"
                      placeholder={<Text id="integration.broadlink.remote.namePlaceholder" />}
                    />
                  </Localizer>
                </div>
                <div class="form-group">
                  <label class="form-label" for={`room_${deviceIndex}`}>
                    <Text id="integration.broadlink.remote.roomLabel" />
                  </label>
                  <select onChange={this.updateDeviceRoom} class="form-control" id={`room_${deviceIndex}`}>
                    <option value="">
                      <Text id="global.emptySelectOption" />
                    </option>
                    {houses.map(house => (
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

                {!isRemote && (
                  <div class="form-group">
                    <label class="form-label">
                      <Text id="integration.broadlink.remote.featuresLabel" />
                    </label>
                    <div class="tags">
                      {device.features &&
                        device.features.map(feature => (
                          <span class="tag">
                            <Text id={`deviceFeatureCategory.${feature.category}.${feature.type}`} />
                            <div class="tag-addon">
                              <i
                                class={`fe fe-${get(
                                  DeviceFeatureCategoriesIcon,
                                  `${feature.category}.${feature.type}`
                                )}`}
                              />
                            </div>
                          </span>
                        ))}
                    </div>
                  </div>
                )}

                <div class="form-group">
                  <button onClick={this.saveDevice} class="btn btn-success mr-2">
                    <Text id="integration.broadlink.remote.saveButton" />
                  </button>
                  <button onClick={this.deleteDevice} class="btn btn-danger">
                    <Text id="integration.broadlink.remote.deleteButton" />
                  </button>

                  {isRemote && (
                    <Link href={`/dashboard/integration/device/broadlink/edit/${device.selector}`}>
                      <button class="btn btn-secondary float-right">
                        <Text id="integration.mqtt.device.editButton" />
                      </button>
                    </Link>
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

export default RemoteBox;
