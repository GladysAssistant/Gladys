import { Text } from 'preact-i18n';
import cx from 'classnames';

import style from '../style.css';
import BluetoothPeripheral from './BluetoothPeripheral';
import { RequestStatus } from '../../../../../utils/consts';
import EmptyState from '../EmptyState';
import CheckBluetoothPanel from '../commons/CheckBluetoothPanel';

const BluetoothPeripheralTab = ({
  scan,
  createDevice,
  bluetoothStatus = {},
  bluetoothGetPeripheralsStatus,
  bluetoothPeripherals = [],
  currentIntegration = {}
}) => {
  const scanning = bluetoothStatus.scanning || bluetoothGetPeripheralsStatus === RequestStatus.Getting;

  return (
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">
          <Text id="integration.bluetooth.setup.title" />
        </h3>
        <div class="page-options d-flex">
          <button
            class={cx('btn', {
              'btn-outline-danger': bluetoothStatus.scanning,
              'btn-outline-primary': !bluetoothStatus.scanning
            })}
            onClick={scan}
            disabled={!bluetoothStatus.ready || bluetoothStatus.peripheralLookup}
          >
            <Text id="integration.bluetooth.setup.scanButton" /> <i class="fe fe-radio" />
          </button>
        </div>
      </div>
      <div class="card-body">
        <CheckBluetoothPanel />
        <div
          class={cx('dimmer', {
            active: scanning && !bluetoothStatus.peripheralLookup,
            [style.bluetoothListBody]: scanning && !bluetoothStatus.peripheralLookup
          })}
        >
          <div class="loader" />
          <div class="dimmer-content">
            <div class="row">
              {bluetoothStatus.ready && bluetoothPeripherals.length === 0 && (
                <EmptyState id="integration.bluetooth.setup.noDeviceFound" />
              )}
              {bluetoothStatus.ready &&
                bluetoothPeripherals.map((peripheral, index) => (
                  <BluetoothPeripheral
                    peripheral={peripheral}
                    peripheralIndex={index}
                    createDevice={createDevice}
                    scan={scan}
                    bluetoothStatus={bluetoothStatus}
                    currentIntegration={currentIntegration}
                  />
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BluetoothPeripheralTab;
