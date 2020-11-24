import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';

import { RequestStatus } from '../../../../../utils/consts';
import Device from './Device';
import style from './style.css';

const DeviceTab = ({ children, ...props }) => (
  <div class="card">
    <div class="card-header">
      <h3 class="card-title">
        <Text id="integration.domoticz.device.title" />
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
              placeholder={<Text id="integration.domoticz.device.search" />}
              onInput={props.debouncedSearch}
            />
          </Localizer>
        </div>
      </div>
    </div>
    <div class="card-body">
      <div
        class={cx('dimmer', {
          active: props.getDomoticzDevicesStatus === RequestStatus.Getting
        })}
      >
        <div class="loader" />
        <div class="dimmer-content">
          {props.domoticzDevices && props.domoticzDevices.length === 0 && (
            <div class="alert alert-info">
              <Text id="integration.domoticz.device.noDevices" />
            </div>
          )}
          {props.getDomoticzDevicesStatus === RequestStatus.Getting && <div class={style.emptyDiv} />}
          <div class="row">
            {props.domoticzDevices &&
              props.domoticzDevices.map((domoticzDevice, index) => (
                <Device
                  device={domoticzDevice}
                  deviceIndex={index}
                  houses={props.houses}
                  updateDeviceProperty={props.updateDeviceProperty}
                  saveDevice={props.saveDevice}
                  deleteDevice={props.deleteDevice}
                  user={props.user}
                />
              ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default DeviceTab;
