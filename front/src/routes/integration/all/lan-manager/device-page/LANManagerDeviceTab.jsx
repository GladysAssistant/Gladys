import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';

import { RequestStatus } from '../../../../../utils/consts';
import LANManagerDevice from './LANManagerDevice';
import EmptyState from '../EmptyState';
import style from '../style.css';

const LANManagerDeviceTab = ({ children, getLANManagerDevicesStatus, lanManagerDevices, ...props }) => (
  <div class="card">
    <div class="card-header">
      <h1 class="card-title">
        <Text id="integration.lanManager.device.title" />
      </h1>
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
              placeholder={<Text id="integration.lanManager.device.search" />}
              onInput={props.debouncedSearch}
            />
          </Localizer>
        </div>
      </div>
    </div>
    <div class="card-body">
      <div
        class={cx('dimmer', {
          active: getLANManagerDevicesStatus === RequestStatus.Getting,
          [style.lanManagerListBody]: getLANManagerDevicesStatus === RequestStatus.Getting
        })}
      >
        <div class="loader" />
        <div class="dimmer-content">
          <div class="row">
            {lanManagerDevices &&
              lanManagerDevices.map((lanManagerDevice, index) => (
                <LANManagerDevice
                  device={lanManagerDevice}
                  deviceIndex={index}
                  houses={props.houses}
                  updateDeviceProperty={props.updateDeviceProperty}
                  saveDevice={props.saveDevice}
                  deleteDevice={props.deleteDevice}
                />
              ))}
            {(!lanManagerDevices || lanManagerDevices.length === 0) && (
              <EmptyState id="integration.lanManager.device.noDevices" />
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default LANManagerDeviceTab;
