import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';

import { RequestStatus } from '../../../../../utils/consts';
import BluetoothDevice from './BluetoothDevice';
import EmptyState from '../EmptyState';
import style from '../style.css';

const BluetoothDeviceTab = ({ children, getBluetoothDevicesStatus, bluetoothDevices, ...props }) => (
  <div class="card">
    <div class="card-header">
      <h3 class="card-title">
        <Text id="integration.bluetooth.device.title" />
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
              placeholder={<Text id="integration.bluetooth.device.search" />}
              onInput={props.debouncedSearch}
            />
          </Localizer>
        </div>
      </div>
    </div>
    <div class="card-body">
      <div
        class={cx('dimmer', {
          active: getBluetoothDevicesStatus === RequestStatus.Getting,
          [style.bluetoothListBody]: getBluetoothDevicesStatus === RequestStatus.Getting
        })}
      >
        <div class="loader" />
        <div class="dimmer-content">
          <div class="row">
            {bluetoothDevices &&
              bluetoothDevices.map((bluetoothDevice, index) => (
                <BluetoothDevice
                  device={bluetoothDevice}
                  deviceIndex={index}
                  houses={props.houses}
                  updateDeviceProperty={props.updateDeviceProperty}
                  saveDevice={props.saveDevice}
                  deleteDevice={props.deleteDevice}
                />
              ))}
            {(!bluetoothDevices || bluetoothDevices.length === 0) && (
              <EmptyState id="integration.bluetooth.device.noDevices" />
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default BluetoothDeviceTab;
