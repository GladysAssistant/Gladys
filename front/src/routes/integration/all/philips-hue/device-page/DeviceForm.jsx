import { Text, Localizer } from 'preact-i18n';
import { Component } from 'preact';

import DeviceFeatures from '../../../../../components/device/view/DeviceFeatures';
import DeviceRoomSelector from '../../../../../components/device/form/DeviceRoomSelector';

class PhilipsHueDeviceForm extends Component {
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
          <DeviceRoomSelector selectedRoomId={props.device.room_id} inputId="room" updateRoom={this.updateRoom} />
        </div>

        <div class="form-group">
          <label class="form-label">
            <Text id="integration.mqtt.device.featuresLabel" />
          </label>
          <DeviceFeatures features={props.device.features} />
        </div>
      </div>
    );
  }
}

export default PhilipsHueDeviceForm;
