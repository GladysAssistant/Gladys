import { Text } from 'preact-i18n';
import cx from 'classnames';

import style from '../style.css';
import BluetoothPeripheral from './BluetoothPeripheral';
import { RequestStatus } from '../../../../../utils/consts';
import EmptyState from '../EmptyState';
import CheckBluetoothPanel from '../commons/CheckBluetoothPanel';
import { MobileSectionHeader, MobileGroup, MobileEmptyState, BigButton } from '../../../../../components/mobile';
import {
  MobileIntegrationTab,
  MobileListLoader,
  integrationMobileStyle
} from '../../../../../components/integration/mobile';

// The discovery on a phone (docs/specs/mobile-pages/integration-devices.md): the scan as the
// button of the page — it says "Stop the scan" while one runs, the card only turns red — then
// one row per peripheral found. Same props as the card below.
const MobileBluetoothPeripheralTab = ({
  scan,
  createDevice,
  bluetoothStatus = {},
  bluetoothGetPeripheralsStatus,
  bluetoothPeripherals = [],
  currentIntegration = {}
}) => {
  const scanning = bluetoothStatus.scanning || bluetoothGetPeripheralsStatus === RequestStatus.Getting;
  const loading = scanning && !bluetoothStatus.peripheralLookup;
  return (
    <MobileIntegrationTab dataCy="bluetooth-discover-mobile">
      <CheckBluetoothPanel isMobile />
      <div class={integrationMobileStyle.block}>
        <BigButton
          variant={bluetoothStatus.scanning ? 'dangerSoft' : 'primary'}
          icon={bluetoothStatus.scanning ? 'square' : 'radio'}
          onClick={scan}
          disabled={!bluetoothStatus.ready || bluetoothStatus.peripheralLookup}
          data-cy="bluetooth-discover-scan"
        >
          <Text
            id={bluetoothStatus.scanning ? 'mobileDeviceList.stopScan' : 'integration.bluetooth.discover.scanButton'}
          />
        </BigButton>
      </div>
      <MobileListLoader loading={loading} empty={bluetoothPeripherals.length === 0}>
        {bluetoothStatus.ready && bluetoothPeripherals.length > 0 && (
          <div>
            <MobileSectionHeader
              title={
                <Text
                  id="mobileDeviceList.foundCount"
                  plural={bluetoothPeripherals.length}
                  fields={{ count: bluetoothPeripherals.length }}
                />
              }
            />
            <MobileGroup>
              {bluetoothPeripherals.map((peripheral, index) => (
                <BluetoothPeripheral
                  key={peripheral.selector}
                  isMobile
                  peripheral={peripheral}
                  peripheralIndex={index}
                  createDevice={createDevice}
                  scan={scan}
                  currentIntegration={currentIntegration}
                />
              ))}
            </MobileGroup>
          </div>
        )}
        {bluetoothStatus.ready && bluetoothPeripherals.length === 0 && !loading && (
          <MobileEmptyState icon="bluetooth" text={<Text id="integration.bluetooth.discover.noDeviceFound" />} />
        )}
      </MobileListLoader>
    </MobileIntegrationTab>
  );
};

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
        <h1 class="card-title">
          <Text id="integration.bluetooth.discover.title" />
        </h1>
        <div class="page-options d-flex">
          <button
            class={cx('btn', {
              'btn-outline-danger': bluetoothStatus.scanning,
              'btn-outline-primary': !bluetoothStatus.scanning
            })}
            onClick={scan}
            disabled={!bluetoothStatus.ready || bluetoothStatus.peripheralLookup}
          >
            <Text id="integration.bluetooth.discover.scanButton" /> <i class="fe fe-radio" />
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
                <EmptyState id="integration.bluetooth.discover.noDeviceFound" />
              )}
              {bluetoothStatus.ready &&
                bluetoothPeripherals.map((peripheral, index) => (
                  <BluetoothPeripheral
                    peripheral={peripheral}
                    peripheralIndex={index}
                    createDevice={createDevice}
                    scan={scan}
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

const ResponsiveBluetoothPeripheralTab = props =>
  props.isMobile ? <MobileBluetoothPeripheralTab {...props} /> : <BluetoothPeripheralTab {...props} />;

export default ResponsiveBluetoothPeripheralTab;
