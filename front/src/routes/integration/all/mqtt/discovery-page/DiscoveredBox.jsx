import { Text, Localizer } from 'preact-i18n';
import { Component } from 'preact';
import cx from 'classnames';

import { RequestStatus } from '../../../../../utils/consts';
import DeviceFeatures from '../../../../../components/device/view/DeviceFeatures';

class DiscoveredBox extends Component {
  updateName = e => {
    this.props.updateDeviceField(this.props.deviceIndex, 'name', e.target.value);
  };

  updateRoom = e => {
    this.props.updateDeviceField(this.props.deviceIndex, 'room_id', e.target.value);
  };

  saveDevice = async () => {
    this.setState({
      loading: true
    });
    try {
      await this.props.saveDevice(this.props.deviceIndex);
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

  render({ device = {}, deviceIndex, houses = [] }, { loading, saveError }) {
    const { features = [] } = device;
    const supportedDevice = features.length > 0;
    const enableSaveButton = !device.created_at;
    const enableUpdateButton = device.updatable;
    const alreadyExistsButton = supportedDevice && !enableSaveButton && !enableUpdateButton;

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
                    <Text id="integration.mqtt.discover.saveError" />
                  </div>
                )}
                <div class="form-group">
                  <label class="form-label" for={`name_${deviceIndex}`}>
                    <Text id="integration.mqtt.discover.nameLabel" />
                  </label>
                  <Localizer>
                    <input
                      id={`name_${deviceIndex}`}
                      type="text"
                      value={device.name}
                      onInput={this.updateName}
                      class="form-control"
                      placeholder={<Text id="integration.mqtt.discover.namePlaceholder" />}
                      disabled={!supportedDevice}
                    />
                  </Localizer>
                </div>
                {!supportedDevice && (
                  <div class="alert alert-warning">
                    <Text id="integration.mqtt.discover.deviceNotHandled" />
                  </div>
                )}

                {supportedDevice && (
                  <div>
                    <div class="form-group">
                      <label class="form-label" for={`room_${deviceIndex}`}>
                        <Text id="integration.mqtt.discover.roomLabel" />
                      </label>
                      <select onChange={this.updateRoom} class="form-control" id={`room_${deviceIndex}`}>
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

                    {device.model && (
                      <div class="form-group">
                        <label class="form-label" for={`model_${deviceIndex}`}>
                          <Text id="integration.mqtt.discover.modelLabel" />
                        </label>
                        <input
                          id={`model_${deviceIndex}`}
                          type="text"
                          value={device.model}
                          class="form-control"
                          disabled
                        />
                      </div>
                    )}

                    <div class="form-group">
                      <label class="form-label" for={`external_id_${deviceIndex}`}>
                        <Text id="integration.mqtt.discover.externalIdLabel" />
                      </label>
                      <input
                        id={`external_id_${deviceIndex}`}
                        type="text"
                        value={device.external_id}
                        class="form-control"
                        disabled
                      />
                    </div>

                    <div class="form-group">
                      <label class="form-label">
                        <Text id="integration.mqtt.discover.featuresLabel" />
                      </label>
                      <DeviceFeatures features={device.features} />
                    </div>

                    <div class="form-group">
                      {alreadyExistsButton && (
                        <button disabled="true" class="btn btn-primary mr-2">
                          <Text id="integration.mqtt.discover.alreadyExistsButton" />
                        </button>
                      )}
                      {enableUpdateButton && (
                        <button onClick={this.saveDevice} class="btn btn-success mr-2">
                          <Text id="integration.mqtt.discover.updateButton" />
                        </button>
                      )}
                      {enableSaveButton && (
                        <button onClick={this.saveDevice} class="btn btn-success mr-2">
                          <Text id="integration.mqtt.discover.saveButton" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default DiscoveredBox;
