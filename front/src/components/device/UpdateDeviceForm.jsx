import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import { DeviceFeatureCategoriesIcon } from '../../utils/consts';
import get from 'get-value';
import { DEVICE_POLL_FREQUENCIES } from '../../../../server/utils/constants';

const maxWidth = {
  maxWidth: '400px'
};

class UpdateDeviceForm extends Component {
  updateName = e => this.props.updateDeviceProperty('name', e.target.value);
  updateRoom = e => this.props.updateDeviceProperty('room_id', e.target.value);
  updatePollFrequency = e => this.props.updateDeviceProperty('poll_frequency', e.target.value);
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

        {props.device && props.device.should_poll && (
          <div class="form-group" style={maxWidth}>
            <label>
              <Text id="editDeviceForm.pollFrequency.label" />
            </label>
            <select onChange={this.updatePollFrequency} value={props.device.poll_frequency} class="form-control">
              <option value={DEVICE_POLL_FREQUENCIES.EVERY_MINUTES}>
                <Text id="editDeviceForm.pollFrequency.everyMinutes" />
              </option>
              <option value={DEVICE_POLL_FREQUENCIES.EVERY_30_SECONDS}>
                <Text id="editDeviceForm.pollFrequency.every30Seconds" />
              </option>
              <option value={DEVICE_POLL_FREQUENCIES.EVERY_10_SECONDS}>
                <Text id="editDeviceForm.pollFrequency.every10Seconds" />
              </option>
              <option value={DEVICE_POLL_FREQUENCIES.EVERY_2_SECONDS}>
                <Text id="editDeviceForm.pollFrequency.every2Seconds" />
              </option>
              <option value={DEVICE_POLL_FREQUENCIES.EVERY_SECONDS}>
                <Text id="editDeviceForm.pollFrequency.every1Seconds" />
              </option>
            </select>
          </div>
        )}

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
