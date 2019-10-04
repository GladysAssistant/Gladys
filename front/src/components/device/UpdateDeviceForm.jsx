import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import { DeviceFeatureCategoriesIcon } from '../../utils/consts';
import get from 'get-value';

const maxWidth = {
  maxWidth: '400px'
};

class UpdateDeviceForm extends Component {
  updateName = e => this.props.updateDeviceProperty('name', e.target.value);
  updateRoom = e => this.props.updateDeviceProperty('room_id', e.target.value);
  updateExternalId = e => this.props.updateDeviceProperty('external_id', e.target.value);

  render(props, {}) {
    return (
      <div>
        <div class="form-group" style={maxWidth}>
          <label class="form-label" for="deviceName">
            <Text id="editDeviceForm.nameLabel" />
          </label>
          <Localizer>
            <input
              id="deviceName"
              type="text"
              value={props.device.name}
              onInput={this.updateName}
              class="form-control"
              placeholder={<Text id="editDeviceForm.nameLabel" />}
            />
          </Localizer>
        </div>

        <div class="form-group" style={maxWidth}>
          <label class="form-label" for="room">
            <Text id="editDeviceForm.roomLabel" />
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
            <Text id="editDeviceForm.featuresLabel" />
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
            {(!props.device.features || props.device.features.length === 0) && <Text id="editDeviceForm.noFeatures" />}
          </div>
        </div>
      </div>
    );
  }
}

export default UpdateDeviceForm;
