import { Text, Localizer } from 'preact-i18n';
import { Component } from 'preact';
import cx from 'classnames';
import { DeviceFeatureCategoriesIcon, RequestStatus } from '../../../../../utils/consts';
import get from 'get-value';

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

  render(props, { loading, saveError }) {
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
                  <label class="form-label" for={`name_${props.deviceIndex}`}>
                    <Text id="integration.zigbee2mqtt.nameLabel" />
                  </label>
                  <Localizer>
                    <input
                      id={`name_${props.deviceIndex}`}
                      type="text"
                      value={props.device.name}
                      onInput={this.updateName}
                      class="form-control"
                      placeholder={<Text id="integration.zigbee2mqtt.namePlaceholder" />}
                    />
                  </Localizer>
                </div>

                <div class="form-group">
                  <label class="form-label" for={`room_${props.deviceIndex}`}>
                    <Text id="integration.zigbee2mqtt.roomLabel" />
                  </label>
                  <select onChange={this.updateRoom} class="form-control" id={`room_${props.deviceIndex}`}>
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

                <div class="form-group">
                  <label class="form-label" for={`topic_${props.deviceIndex}`}>
                    <Text id="integration.zigbee2mqtt.topicLabel" />
                  </label>
                  <Localizer>
                    <input
                      id={`topic_${props.deviceIndex}`}
                      type="text"
                      value={props.device.external_id}
                      class="form-control"
                      disabled="true"
                    />
                  </Localizer>
                </div>

                <div class="form-group">
                  <label class="form-label">
                    <Text id="integration.zigbee2mqtt.featuresLabel" />
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
                  </div>
                </div>

                <div class="form-group">
                  {props.device.created_at && (
                    <button disabled="true" class="btn btn-primary mr-2">
                      <Text id="integration.zigbee2mqtt.alreadyExistsButton" />
                    </button>
                  )}
                  {!props.device.created_at && (
                    <button onClick={this.saveDevice} class="btn btn-success mr-2">
                      <Text id="integration.zigbee2mqtt.saveButton" />
                    </button>
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

export default DiscoveredBox;
