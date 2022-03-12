import { Component } from 'preact';
import { Localizer, Text } from 'preact-i18n';

import DeviceFeatures from '../../../../components/device/view/DeviceFeatures';

class YeelightDeviceForm extends Component {
  updateName = e => {
    this.props.updateDeviceProperty(this.props.deviceIndex, 'name', e.target.value);
  };

  updateRoom = e => {
    this.props.updateDeviceProperty(this.props.deviceIndex, 'room_id', e.target.value);
  };

  render({ ...props }) {
    return (
      <div>
        <div class="form-group">
          <label class="form-label" for="deviceName">
            <Text id="integration.yeelight.device.nameLabel" />
          </label>
          <Localizer>
            <input
              id="deviceName"
              type="text"
              value={props.device.name}
              onInput={this.updateName}
              class="form-control"
              placeholder={<Text id="integration.yeelight.device.namePlaceholder" />}
            />
          </Localizer>
        </div>

        <div class="form-group">
          <label class="form-label" for="deviceModel">
            <Text id="integration.yeelight.device.modelLabel" />
          </label>
          <Localizer>
            <input id="deviceModel" type="text" value={props.device.model} class="form-control" disabled />
          </Localizer>
        </div>

        <div class="form-group">
          <label class="form-label" for="deviceIp">
            <Text id="integration.yeelight.device.ipLabel" />
          </label>
          <Localizer>
            <input
              id="deviceIp"
              type="text"
              value={props.device.params.find(param => param.name === 'IP_ADDRESS').value}
              class="form-control"
              disabled
            />
          </Localizer>
        </div>

        <div class="form-group">
          <label class="form-label" for="room">
            <Text id="integration.yeelight.device.roomLabel" />
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
            <Text id="integration.yeelight.device.featuresLabel" />
          </label>
          <DeviceFeatures features={props.device.features} />
        </div>
      </div>
    );
  }
}

export default YeelightDeviceForm;
