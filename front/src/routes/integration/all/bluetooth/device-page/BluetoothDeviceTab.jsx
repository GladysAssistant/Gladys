import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';

import { RequestStatus } from '../../../../../utils/consts';
import BluetoothDevice from './BluetoothDevice';
import EmptyState from '../EmptyState';
import style from '../style.css';
import CardFilter from '../../../../../components/layout/CardFilter';

const BluetoothDeviceTab = ({ children, getBluetoothDevicesStatus, bluetoothDevices, ...props }) => (
  <div class="card">
    <div class="card-header">
      <h1 class="card-title">
        <Text id="integration.bluetooth.device.title" />
      </h1>
      <div class="page-options d-flex">
        <Localizer>
          <CardFilter
            changeOrderDir={props.changeOrderDir}
            orderValue={props.getBluetoothDeviceOrderDir}
            search={props.debouncedSearch}
            searchValue={props.bluetoothDeviceSearch}
            searchPlaceHolder={<Text id="device.searchPlaceHolder" />}
          />
        </Localizer>
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
