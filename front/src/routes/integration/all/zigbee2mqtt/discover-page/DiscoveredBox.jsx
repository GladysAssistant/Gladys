import { Text, Localizer } from 'preact-i18n';
import { Component } from 'preact';
import cx from 'classnames';

import { RequestStatus } from '../../../../../utils/consts';
import DeviceFeatures from '../../../../../components/device/view/DeviceFeatures';
import { DEVICE_FEATURE_CATEGORIES } from '../../../../../../../server/utils/constants';

const GITHUB_BASE_URL = 'https://github.com/GladysAssistant/Gladys/issues/new';

const createGithubUrl = device => {
  const title = encodeURIComponent(`Zigbee2mqtt: Add device ${device.model}`);
  const body = encodeURIComponent(`\`\`\`\n${JSON.stringify(device, null, 2)}\n\`\`\``);
  return `${GITHUB_BASE_URL}?title=${title}&body=${body}`;
};

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
    const enableSaveButton = !device.created_at;
    const enableUpdateButton = device.updatable;
    const supportedDevice = features.findIndex(f => f.category !== DEVICE_FEATURE_CATEGORIES.BATTERY) >= 0;
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
                    <Text id="integration.zigbee2mqtt.saveError" />
                  </div>
                )}
                <div class="form-group">
                  <label class="form-label" for={`name_${deviceIndex}`}>
                    <Text id="integration.zigbee2mqtt.nameLabel" />
                  </label>
                  <Localizer>
                    <input
                      id={`name_${deviceIndex}`}
                      type="text"
                      value={device.name}
                      onInput={this.updateName}
                      class="form-control"
                      placeholder={<Text id="integration.zigbee2mqtt.namePlaceholder" />}
                      disabled={!supportedDevice}
                    />
                  </Localizer>
                </div>
                {!supportedDevice && (
                  <div>
                    <div class="alert alert-warning">
                      <Text id="integration.zigbee2mqtt.discover.deviceNotHandled" />
                    </div>
                    <a class="btn btn-primary" href={createGithubUrl(device)} target="_blank" rel="noopener noreferrer">
                      <Text id="integration.zigbee2mqtt.discover.createGithubIssue" />
                    </a>
                  </div>
                )}

                {supportedDevice && (
                  <div>
                    <div class="form-group">
                      <label class="form-label" for={`room_${deviceIndex}`}>
                        <Text id="integration.zigbee2mqtt.roomLabel" />
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

                    <div class="form-group">
                      <label class="form-label" for={`topic_${deviceIndex}`}>
                        <Text id="integration.zigbee2mqtt.topicLabel" />
                      </label>
                      <Localizer>
                        <input
                          id={`topic_${deviceIndex}`}
                          type="text"
                          value={device.external_id}
                          class="form-control"
                          disabled="true"
                        />
                      </Localizer>
                    </div>

                    <div class="form-group">
                      <label class="form-label">
                        <Text id="integration.zigbee2mqtt.featuresLabel" />
                      </label>
                      <DeviceFeatures features={device.features} />
                    </div>

                    <div class="form-group">
                      {alreadyExistsButton && (
                        <button disabled="true" class="btn btn-primary mr-2">
                          <Text id="integration.zigbee2mqtt.alreadyExistsButton" />
                        </button>
                      )}
                      {enableUpdateButton && (
                        <button onClick={this.saveDevice} class="btn btn-success mr-2">
                          <Text id="integration.zigbee2mqtt.updateButton" />
                        </button>
                      )}
                      {enableSaveButton && (
                        <button onClick={this.saveDevice} class="btn btn-success mr-2">
                          <Text id="integration.zigbee2mqtt.saveButton" />
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
