import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';
import { DeviceFeatureCategoriesIcon } from '../../../../utils/consts';
import get from 'get-value';
import { Models } from './models';
import { Link } from 'preact-router';

class SonoffDeviceBox extends Component {
  updateName = e => {
    this.props.updateDeviceField('sonoffDevices', this.props.deviceIndex, 'name', e.target.value);

    this.setState({
      loading: false
    });
  };

  updateRoom = e => {
    this.props.updateDeviceField('sonoffDevices', this.props.deviceIndex, 'room_id', e.target.value);

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
      let errorMessage = 'integration.sonoff.error.defaultError';
      if (e.response.status === 409) {
        errorMessage = 'integration.sonoff.error.conflictError';
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
        errorMessage: 'integration.sonoff.error.defaultDeletionError'
      });
    }
    this.setState({
      loading: false
    });
  };

  render({ deviceIndex, device, housesWithRooms, editable, ...props }, { loading, errorMessage }) {
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
              <div class="card-body">
                {errorMessage && (
                  <div class="alert alert-danger">
                    <Text id={errorMessage} />
                  </div>
                )}
                <div class="form-group">
                  <label class="form-label" for={`name_${deviceIndex}`}>
                    <Text id="integration.sonoff.nameLabel" />
                  </label>
                  <Localizer>
                    <input
                      id={`name_${deviceIndex}`}
                      type="text"
                      value={device.name}
                      onInput={this.updateName}
                      class="form-control"
                      placeholder={<Text id="integration.sonoff.namePlaceholder" />}
                      disabled={!editable}
                    />
                  </Localizer>
                </div>

                <div class="form-group">
                  <label class="form-label" for={`room_${deviceIndex}`}>
                    <Text id="integration.sonoff.roomLabel" />
                  </label>
                  <select
                    onChange={this.updateRoom}
                    class="form-control"
                    id={`room_${deviceIndex}`}
                    disabled={!editable}
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

                <div class="form-group">
                  <label class="form-label" for={`topic_${deviceIndex}`}>
                    <Text id="integration.sonoff.topicLabel" />
                  </label>
                  <Localizer>
                    <input
                      id={`topic_${deviceIndex}`}
                      type="text"
                      value={device.external_id.substring(7)}
                      class="form-control"
                      disabled="true"
                    />
                  </Localizer>
                </div>

                <div class="form-group">
                  <label class="form-label" for={`model_${deviceIndex}`}>
                    <Text id="integration.sonoff.modelLabel" />
                  </label>
                  <input
                    id={`model_${deviceIndex}`}
                    type="text"
                    value={Models[device.model].getLabel()}
                    class="form-control"
                    disabled="true"
                  />
                </div>

                <div class="form-group">
                  <label class="form-label">
                    <Text id="integration.sonoff.device.featuresLabel" />
                  </label>
                  <div class="tags">
                    {device.features &&
                      device.features.map(feature => (
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

                <div class="form-group">
                  {props.alreadyCreatedButton && (
                    <button class="btn btn-primary mr-2" disabled="true">
                      <Text id="integration.sonoff.alreadyCreatedButton" />
                    </button>
                  )}

                  {props.updateButton && (
                    <button onClick={this.saveDevice} class="btn btn-success mr-2">
                      <Text id="integration.sonoff.updateButton" />
                    </button>
                  )}

                  {props.saveButton && (
                    <button onClick={this.saveDevice} class="btn btn-success mr-2">
                      <Text id="integration.sonoff.saveButton" />
                    </button>
                  )}

                  {props.deleteButton && (
                    <button onClick={this.deleteDevice} class="btn btn-danger">
                      <Text id="integration.sonoff.deleteButton" />
                    </button>
                  )}

                  {props.editButton && (
                    <Link href={`/dashboard/integration/device/sonoff/edit/${device.selector}`}>
                      <button class="btn btn-secondary float-right">
                        <Text id="integration.sonoff.device.editButton" />
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

export default SonoffDeviceBox;
