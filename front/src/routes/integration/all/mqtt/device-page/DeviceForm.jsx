import { Text, Localizer } from 'preact-i18n';
import { Component } from 'preact';
import dayjs from 'dayjs';

import DeviceFeatures from '../../../../../components/device/view/DeviceFeatures';

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
          <DeviceFeatures features={props.device.features} />
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
