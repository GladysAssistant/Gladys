import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';
import { DeviceFeatureCategoriesIcon } from '../../../../utils/consts';
import get from 'get-value';
import { Link } from 'preact-router';

class Zwave2mqttDeviceBox extends Component {
  updateName = e => {
    this.props.updateDeviceField(this.props.listName, this.props.deviceIndex, 'name', e.target.value);

    this.setState({
      loading: false
    });
  };

  updateRoom = e => {
    this.props.updateDeviceField(this.props.listName, this.props.deviceIndex, 'room_id', e.target.value);

    this.setState({
      loading: false
    });
  };

  updateFeature = e => {
    this.props.updateDeviceFeature(this.props.listName, this.props.deviceIndex, 'feature_id', e.target.value);

    this.setState({
      loading: false
    });
  };

  saveDevice = async () => {
    this.setState({
      loading: true,
      errorMessage: null
    });
    try {
      await this.props.saveDevice(this.props.listName, this.props.deviceIndex);
    } catch (e) {
      let errorMessage = 'integration.zwave2mqtt.error.defaultError';
      if (e.response.status === 409) {
        errorMessage = 'integration.zwave2mqtt.error.conflictError';
      }
      this.setState({
        errorMessage
      });
    }
    this.setState({
      loading: false
    });
  };

  deleteDevice = async () => {
    this.setState({
      loading: true,
      errorMessage: null
    });
    try {
      await this.props.deleteDevice(this.props.deviceIndex);
    } catch (e) {
      this.setState({
        errorMessage: 'integration.zwave2mqtt.error.defaultDeletionError'
      });
    }
    this.setState({
      loading: false
    });
  };

  render({ deviceIndex, device, housesWithRooms, editable, ...props }, { loading, errorMessage }) {
    const validModel = device.features.length > 0 || device.needAuthentication;

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
              <div
                class={cx('card-body', {
                  invisible: device.needAuthentication
                })}
              >
                {errorMessage && (
                  <div class="alert alert-danger">
                    <Text id={errorMessage} />
                  </div>
                )}
                <div class="form-group">
                  <label class="form-label" for={`name_${deviceIndex}`}>
                    <Text id="integration.zwave2mqtt.nameLabel" />
                  </label>
                  <Localizer>
                    <input
                      id={`name_${deviceIndex}`}
                      type="text"
                      value={device.name}
                      onInput={this.updateName}
                      class="form-control"
                      placeholder={<Text id="integration.zwave2mqtt.namePlaceholder" />}
                      disabled={!editable || !validModel}
                    />
                  </Localizer>
                </div>

                <div class="form-group">
                  <label class="form-label" for={`room_${deviceIndex}`}>
                    <Text id="integration.zwave2mqtt.roomLabel" />
                  </label>
                  <select
                    onChange={this.updateRoom}
                    class="form-control"
                    id={`room_${deviceIndex}`}
                    disabled={!editable || !validModel}
                  >
                    <option value="">
                      <Text id="global.emptySelectOption" />
                    </option>
                    {housesWithRooms &&
                      housesWithRooms.map(house => (
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

                {/**
                <div class="form-group">
                  <label class="form-label" for={`topic_${deviceIndex}`}>
                    <Text id={`integration.zwave2mqtt.protocolLabels.${deviceProtocol}`} />
                  </label>
                  <input
                    id={`topic_${deviceIndex}`}
                    type="text"
                    value={device.external_id.substring(8)}
                    class="form-control"
                    disabled="true"
                  />
                </div>

                {props.editButton && (
                  <div class="form-group">
                    <label class="form-label">
                      <Text id="integration.zwave2mqtt.device.protocolLabel" />
                    </label>
                    <div class="form-check form-check-inline">
                      <label class="custom-control custom-radio">
                        <input
                          type="radio"
                          class="custom-control-input"
                          name={`device-protocol-${deviceIndex}`}
                          value="mqtt"
                          checked="true"
                          disabled
                        />
                        <div class="custom-control-label">
                          <Text id="integration.zwave2mqtt.device.protocolMQTT" />
                        </div>
                      </label>
                    </div>
                  </div>
                )}
                */}

                {device.features && device.features.length > 0 && (
                  <div class="form-group">
                    <label class="form-label">
                      <Text id="integration.zwave2mqtt.device.featuresLabel" />
                    </label>
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
                  </div>
                )}

                <div class="form-group">
                  {validModel && props.alreadyCreatedButton && (
                    <button class="btn btn-primary mr-2" disabled="true">
                      <Text id="integration.zwave2mqtt.alreadyCreatedButton" />
                    </button>
                  )}

                  {validModel && props.updateButton && (
                    <button onClick={this.saveDevice} class="btn btn-success mr-2">
                      <Text id="integration.zwave2mqtt.updateButton" />
                    </button>
                  )}

                  {validModel && props.saveButton && (
                    <button onClick={this.saveDevice} class="btn btn-success mr-2">
                      <Text id="integration.zwave2mqtt.saveButton" />
                    </button>
                  )}

                  {validModel && props.deleteButton && (
                    <button onClick={this.deleteDevice} class="btn btn-danger">
                      <Text id="integration.zwave2mqtt.deleteButton" />
                    </button>
                  )}

                  {!validModel && (
                    <button class="btn btn-dark" disabled>
                      <Text id="integration.zwave2mqtt.unmanagedModelButton" />
                    </button>
                  )}

                  {validModel && props.editButton && (
                    <Link href={`/dashboard/integration/device/zwave2mqtt/edit/${device.selector}`}>
                      <button class="btn btn-secondary float-right">
                        <Text id="integration.zwave2mqtt.device.editButton" />
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

export default Zwave2mqttDeviceBox;
