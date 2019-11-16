import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';

import { RequestStatus } from '../../../../utils/consts';
import Device from './Device';
import style from './style.css';

const DevicePanel = ({ children, ...props }) => (
  <div class="card">
    <div class="card-header">
      <h3 class="card-title">
        <Text id="integration.magicDevices.device.title" />
      </h3>
      <div class="page-options d-flex">
        <select onChange={props.changeOrderDir} class="form-control custom-select w-auto">
          <option value="asc">
            <Text id="global.orderDirAsc" />
          </option>
          <option value="desc">
            <Text id="global.orderDirDesc" />
          </option>
        </select>
        <div class="input-icon ml-2">
          <span class="input-icon-addon">
            <i class="fe fe-search" />
          </span>
          <Localizer>
            <input
              type="text"
              class="form-control w-10"
              placeholder={<Text id="integration.magicDevices.device.searchPlaceholder" />}
              value={props.magicDeviceSearch}
              onInput={props.debouncedSearch}
            />
          </Localizer>
        </div>
      </div>
    </div>
    <div class="card-body">
      <div
        class={cx('dimmer', {
          active: props.getMagicDevicesStatus === RequestStatus.Getting
        })}
      >
        <div class="loader" />
        <div class="dimmer-content">
          {props.getMagicDevicesStatus === RequestStatus.Getting && <div class={style.emptyDiv} />}
          <div class="row">
            {props.magicDevices &&
              props.magicDevices.map((device, index) => (
                <Device
                  device={device}
                  deviceIndex={index}
                  houses={props.houses}
                  updateDeviceProperty={props.updateDeviceProperty}
                  saveDevice={props.saveDevice}
                  deleteDevice={props.deleteDevice}
                />
              ))}
            {props.magicDevices && props.magicDevices.length === 0 && (
              <p class="text-center">
                <Text id="integration.magicDevices.device.noDevices" />
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default DevicePanel;
