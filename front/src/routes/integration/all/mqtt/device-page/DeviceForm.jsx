import { Text, Localizer } from 'preact-i18n';
import { Component } from 'preact';
import cx from 'classnames';
import dayjs from 'dayjs';

import DeviceFeatures from '../../../../../components/device/view/DeviceFeatures';
import { isDeviceFieldErrored } from './utils';

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

  render({ compact, validationErrors, ...props }) {
    const nameErrored = isDeviceFieldErrored(validationErrors, 'name');
    const externalIdErrored = isDeviceFieldErrored(validationErrors, 'external_id');
    const roomErrored = isDeviceFieldErrored(validationErrors, 'room_id');

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
              class={cx('form-control', { 'is-invalid': nameErrored })}
              placeholder={<Text id="integration.mqtt.device.nameLabel" />}
            />
          </Localizer>
          {nameErrored && (
            <div class="invalid-feedback d-block">
              <Text id="integration.mqtt.device.validationErrors.name" />
            </div>
          )}
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
              class={cx('form-control', { 'is-invalid': externalIdErrored })}
              placeholder={<Text id="integration.mqtt.device.externalIdLabel" />}
            />
          </Localizer>
          {externalIdErrored && (
            <div class="invalid-feedback d-block">
              <Text id="integration.mqtt.device.validationErrors.external_id" />
            </div>
          )}
        </div>

        <div class="form-group">
          <label class="form-label" for="room">
            <Text id="integration.mqtt.device.roomLabel" />
          </label>
          <select
            onChange={this.updateRoom}
            class={cx('form-control', { 'is-invalid': roomErrored })}
            id="room"
          >
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
          {roomErrored && (
            <div class="invalid-feedback d-block">
              <Text id="integration.mqtt.device.validationErrors.room_id" />
            </div>
          )}
        </div>

        {!compact && (
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
        )}
      </div>
    );
  }
}

export default MqttDeviceForm;
