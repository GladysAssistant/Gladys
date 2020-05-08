import { Text, Localizer } from 'preact-i18n';
import { Component } from 'preact';
import { DeviceFeatureCategoriesIcon } from '../../../../../utils/consts';
import get from 'get-value';
import dayjs from 'dayjs';
import RoomSelector from '../../../../../components/house/RoomSelector';

class MqttDeviceForm extends Component {
  updateName = e => {
    this.props.updateDeviceProperty(this.props.deviceIndex, 'name', e.target.value);
  };

  updateRoom = room => {
    this.props.updateDeviceProperty(this.props.deviceIndex, 'room_id', get(room, 'id'));
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
          <label class="form-label">
            <Text id="integration.mqtt.device.externalIdLabel" />
          </label>
          <Localizer>
            <input
              type="text"
              value={props.device.external_id}
              onInput={this.updateExternalId}
              disabled={props.device.created_at !== undefined}
              class="form-control"
              placeholder={<Text id="integration.mqtt.device.externalIdLabel" />}
            />
          </Localizer>
        </div>

        <div class="form-group">
          <label class="form-label" for="room">
            <Text id="integration.mqtt.device.roomLabel" />
          </label>
          <RoomSelector
            updateRoomSelection={this.updateRoom}
            uniqueKey="id"
            selectedRoom={props.device.room_id}
            clearable
          />
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
          <p class="mt-4">
            {props.mostRecentValueAt ? (
              <Text
                id="integration.mqtt.device.mostRecentValueAt"
                fields={{
                  mostRecentValueAt: dayjs(props.mostRecentValueAt)
                    .locale(props.user.language)
                    .fromNow()
                }}
              />
            ) : (
              <Text id="integration.mqtt.device.noValueReceived" />
            )}
          </p>
        </div>
      </div>
    );
  }
}

export default MqttDeviceForm;
