import { Text } from 'preact-i18n';
import cx from 'classnames';

import style from '../style.css';
import AwoxPeripheral from './AwoxPeripheral';
import { RequestStatus } from '../../../../../utils/consts';
import EmptyState from '../EmptyState';
import CheckBluetoothPanel from '../../bluetooth/commons/CheckBluetoothPanel';

const AwoxPeripheralTab = ({
  scan,
  createDevice,
  bluetoothStatus = {},
  awoxGetPeripheralsStatus,
  awoxPeripherals = [],
  currentIntegration = {}
}) => {
  const scanning = bluetoothStatus.scanning || awoxGetPeripheralsStatus === RequestStatus.Getting;

  return (
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">
          <Text id="integration.awox.setup.title" />
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
            <Text id="integration.awox.setup.scanButton" /> <i class="fe fe-radio" />
          </button>
        </div>
      </div>
      <div class="card-body">
        <CheckBluetoothPanel />
        <div
          class={cx('dimmer', {
            active: scanning && !bluetoothStatus.peripheralLookup,
            [style.awoxListBody]: scanning && !bluetoothStatus.peripheralLookup
          })}
        >
          <div class="loader" />
          <div class="dimmer-content">
            <div class="alert alert-info">
              <Text id="integration.awox.setup.scanInfo" />
            </div>
            <div class="row">
              {bluetoothStatus.ready && awoxPeripherals.length === 0 && (
                <EmptyState id="integration.awox.setup.noDeviceFound" />
              )}
              {bluetoothStatus.ready &&
                awoxPeripherals.map((peripheral, index) => (
                  <AwoxPeripheral
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

export default AwoxPeripheralTab;
