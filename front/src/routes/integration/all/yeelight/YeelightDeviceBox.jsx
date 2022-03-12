import cx from 'classnames';
import { Component } from 'preact';
import { Localizer, Text } from 'preact-i18n';
import { Link } from 'preact-router';

import DeviceFeatures from '../../../../components/device/view/DeviceFeatures';

class YeelightDeviceBox extends Component {
  updateName = e => {
    this.props.updateDeviceField(this.props.listName, this.props.deviceIndex, 'name', e.target.value);
  };

  updateRoom = e => {
    this.props.updateDeviceField(this.props.listName, this.props.deviceIndex, 'room_id', e.target.value);
  };

  saveDevice = async () => {
    this.setState({ loading: true, errorMessage: null });
    try {
      await this.props.saveDevice(this.props.listName, this.props.deviceIndex);
    } catch (e) {
      let errorMessage = 'integration.yeelight.error.defaultError';
      if (e.response && e.response.status === 409) {
        errorMessage = 'integration.yeelight.error.conflictError';
      }
      this.setState({ errorMessage });
    }
    this.setState({ loading: false });
  };

  deleteDevice = async () => {
    this.setState({ loading: true, errorMessage: null });
    try {
      await this.props.deleteDevice(this.props.deviceIndex);
    } catch (e) {
      this.setState({
        errorMessage: 'integration.yeelight.error.defaultDeletionError'
      });
    }
    this.setState({ loading: false });
  };

  render(props, { loading, errorMessage }) {
    const validModel = props.device.features && props.device.features.length > 0;

    return (
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">{props.device.name}</div>
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
                  <label class="form-label" for={`name_${props.deviceIndex}`}>
                    <Text id="integration.yeelight.nameLabel" />
                  </label>
                  <Localizer>
                    <input
                      id={`name_${props.deviceIndex}`}
                      type="text"
                      value={props.device.name}
                      onInput={this.updateName}
                      class="form-control"
                      placeholder={<Text id="integration.yeelight.namePlaceholder" />}
                      disabled={!props.editable || !validModel}
                    />
                  </Localizer>
                </div>

                <div class="form-group">
                  <label class="form-label" for={`model_${props.deviceIndex}`}>
                    <Text id="integration.yeelight.modelLabel" />
                  </label>
                  <Localizer>
                    <input
                      id={`model_${props.deviceIndex}`}
                      type="text"
                      value={props.device.model}
                      class="form-control"
                      disabled="true"
                    />
                  </Localizer>
                </div>

                <div class="form-group">
                  <label class="form-label" for={`ip_${props.deviceIndex}`}>
                    <Text id="integration.yeelight.ipLabel" />
                  </label>
                  <Localizer>
                    <input
                      id={`ip_${props.deviceIndex}`}
                      type="text"
                      value={props.device.params.find(param => param.name === 'IP_ADDRESS').value}
                      class="form-control"
                      disabled="true"
                    />
                  </Localizer>
                </div>

                <div class="form-group">
                  <label class="form-label" for={`room_${props.deviceIndex}`}>
                    <Text id="integration.yeelight.roomLabel" />
                  </label>
                  <select
                    id={`room_${props.deviceIndex}`}
                    onChange={this.updateRoom}
                    class="form-control"
                    disabled={!props.editable || !validModel}
                  >
                    <option value="">
                      <Text id="global.emptySelectOption" />
                    </option>
                    {props.housesWithRooms &&
                      props.housesWithRooms.map(house => (
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

                {validModel && (
                  <div class="form-group">
                    <label class="form-label">
                      <Text id="integration.yeelight.device.featuresLabel" />
                    </label>
                    <DeviceFeatures features={props.device.features} />
                  </div>
                )}

                <div class="form-group">
                  {validModel && props.alreadyCreatedButton && (
                    <button class="btn btn-primary mr-2" disabled="true">
                      <Text id="integration.yeelight.alreadyCreatedButton" />
                    </button>
                  )}

                  {validModel && props.updateButton && (
                    <button onClick={this.saveDevice} class="btn btn-success mr-2">
                      <Text id="integration.yeelight.updateButton" />
                    </button>
                  )}

                  {validModel && props.saveButton && (
                    <button onClick={this.saveDevice} class="btn btn-success mr-2">
                      <Text id="integration.yeelight.saveButton" />
                    </button>
                  )}

                  {validModel && props.deleteButton && (
                    <button onClick={this.deleteDevice} class="btn btn-danger">
                      <Text id="integration.yeelight.deleteButton" />
                    </button>
                  )}

                  {!validModel && (
                    <button class="btn btn-dark" disabled>
                      <Text id="integration.yeelight.unmanagedModelButton" />
                    </button>
                  )}

                  {validModel && props.editButton && (
                    <Link href={`/dashboard/integration/device/yeelight/edit/${props.device.selector}`}>
                      <button class="btn btn-secondary float-right">
                        <Text id="integration.yeelight.device.editButton" />
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

export default YeelightDeviceBox;
