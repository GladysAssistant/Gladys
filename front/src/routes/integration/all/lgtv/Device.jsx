import { useState, useCallback } from 'preact/hooks';
import { Text, Localizer } from 'preact-i18n';
import { Component } from 'preact';
import cx from 'classnames';

import { RoomInput } from './common';

import get from 'get-value';
import { Link } from 'preact-router';

import { RequestStatus, DeviceFeatureCategoriesIcon } from '../../../../utils/consts';

import style from './style.css';

const LGTVDevice = ({
  device,
  showTitle,
  showDeleteButton,
  houses,
  onDeviceUpdate,
  onDeviceDelete,
  updateDeviceProperty
}) => {
  const [isLoading, setLoading] = useState(false);

  const onUpdate = useCallback(async () => {
    await onDeviceUpdate(device);
  });
  const onDelete = useCallback(async () => {
    await onDeviceDelete(device);
  });

  const updateRoom = useCallback(e => updateDeviceProperty(device, 'room_id', e.target.value));
  const updateName = useCallback(e => updateDeviceProperty(device, 'name', e.target.value));
  const ipAddressParam = device.params.find(param => param.name === 'address');
  const { value: address } = ipAddressParam;

  return (
    <div class="col-md-6">
      <div class="card">
        {showTitle && <div class="card-header">{device.name}</div>}
        <div
          class={cx('dimmer', {
            active: isLoading
          })}
        >
          <div class="loader" />
          <div class="dimmer-content">
            <div class="card-body">
              <div class="form-group">
                <label>
                  <Text id="integration.lgtv.device.ipLabel" />
                </label>
                <Localizer>
                  <input type="text" value={address} class="form-control" />
                </Localizer>
              </div>
              <div class="form-group">
                <label>
                  <Text id="integration.lgtv.device.nameLabel" />
                </label>
                <Localizer>
                  <input type="text" value={device.name} onInput={updateName} class="form-control" />
                </Localizer>
              </div>
              <RoomInput onChange={updateRoom} houses={houses} selectedRoomId={device.room_id} />
              <div class="form-group">
                <button onClick={onUpdate} class="btn btn-success mr-2">
                  <Text id="integration.lgtv.device.saveButton" />
                </button>
                {showDeleteButton && (
                  <button onClick={onDelete} class="btn btn-danger">
                    <Text id="integration.lgtv.device.deleteButton" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LGTVDevice;
