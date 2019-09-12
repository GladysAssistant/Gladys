import { Text, Localizer } from 'preact-i18n';
import { Component } from 'preact';
import { DeviceFeatureCategoriesIcon } from '../../../../../utils/consts';
import get from 'get-value';

class MqttDeviceForm extends Component {
  updateName = e => {
    this.props.updateDeviceProperty(this.props.deviceIndex, 'name', e.target.value);
  };

  updateRoom = e => {
    this.props.updateDeviceProperty(this.props.deviceIndex, 'room_id', e.target.value);
  };

  updateExternalId = e => {
    this.props.updateDeviceProperty(this.props.deviceIndex, 'external_id', e.target.value);
  };

  render({ ...props }) {
    return (
      <div>
        <div class="form-group">
          <label class="form-label" for="deviceName">
            <Text id="integration.mqtt.device.nameLabel" />
          </label>
          <Localizer>
            <input
              id="deviceName"
              type="text"
              value={props.device.name}
              onInput={this.updateName}
              class="form-control"
              placeholder={<Text id="integration.mqtt.device.nameLabel" />}
            />
          </Localizer>
        </div>

        <div class="form-group">
          <label class="form-label" for="room">
            <Text id="integration.mqtt.device.roomLabel" />
          </label>
          <select onChange={this.updateRoom} class="form-control" id="room">
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
          <label class="form-label">
            <Text id="integration.mqtt.device.featuresLabel" />
          </label>
          <div class="tags">
            {props.device &&
              props.device.features &&
              props.device.features.map(feature => (
                <span class="tag">
                  <Text id={`deviceFeatureCategory.${feature.category}.${feature.type}`} />
                  <div class="tag-addon">
                    <i class={`fe fe-${get(DeviceFeatureCategoriesIcon, `${feature.category}.${feature.type}`)}`} />
                  </div>
                </span>
              ))}
            {(!props.device.features || props.device.features.length === 0) && (
              <Text id="integration.mqtt.device.noFeatures" />
            )}
          </div>
        </div>
      </div>
    );
  }
}

export default MqttDeviceForm;
