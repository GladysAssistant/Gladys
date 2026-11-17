import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';

import { RequestStatus } from '../../../../../utils/consts';
import BluetoothDevice from './BluetoothDevice';
import EmptyState from '../EmptyState';
import style from '../style.css';
import CardFilter from '../../../../../components/layout/CardFilter';
import { MobileSectionHeader, MobileGroup, MobileNotice, MobileEmptyState } from '../../../../../components/mobile';
import {
  MobileIntegrationTab,
  MobileListToolbar,
  MobileListLoader,
  integrationMobileStyle
} from '../../../../../components/integration/mobile';

// The devices on a phone (docs/specs/mobile-pages/integration-devices.md): one row per device,
// opening the sheet that holds what its card holds. Same props as the card below.
const MobileBluetoothDeviceTab = ({ getBluetoothDevicesStatus, bluetoothDevices, ...props }) => {
  const loading = getBluetoothDevicesStatus === RequestStatus.Getting;
  const devices = bluetoothDevices || [];
  return (
    <MobileIntegrationTab dataCy="bluetooth-devices-mobile">
      <MobileListToolbar
        // the search is debounced: the field is not controlled, it only starts from the query
        // still applied to the list when it mounts again
        initialSearchValue={props.bluetoothDeviceSearch}
        onSearch={props.debouncedSearch}
        orderDir={props.getBluetoothDeviceOrderDir}
        onOrderChange={props.changeOrderDir}
      />
      <MobileListLoader loading={loading} empty={devices.length === 0}>
        {devices.length > 0 && (
          <div>
            <MobileSectionHeader
              title={
                <Text id="mobileDeviceList.deviceCount" plural={devices.length} fields={{ count: devices.length }} />
              }
            />
            <MobileGroup>
              {devices.map((bluetoothDevice, index) => (
                <BluetoothDevice
                  key={bluetoothDevice.selector}
                  isMobile
                  device={bluetoothDevice}
                  deviceIndex={index}
                  houses={props.houses}
                  updateDeviceProperty={props.updateDeviceProperty}
                  saveDevice={props.saveDevice}
                  deleteDevice={props.deleteDevice}
                />
              ))}
            </MobileGroup>
          </div>
        )}
        {devices.length === 0 && !loading && (
          <MobileEmptyState icon="bluetooth" text={<Text id="integration.bluetooth.device.noDevices" />} />
        )}
      </MobileListLoader>
      {/* what the integration cannot do comes after the devices, which are what one comes for */}
      <div class={integrationMobileStyle.afterList}>
        <MobileNotice tone="warning" icon="alert-triangle">
          <strong>
            <Text id="integration.bluetooth.warningTitle" />
          </strong>
          <br />
          <Text id="integration.bluetooth.warningMessage" />
        </MobileNotice>
      </div>
    </MobileIntegrationTab>
  );
};

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
      <div class="alert alert-warning">
        <h4 class="alert-heading">
          <i class="fe fe-alert-triangle mr-2" />
          <Text id="integration.bluetooth.warningTitle" />
        </h4>
        <Text id="integration.bluetooth.warningMessage" />
      </div>
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

const ResponsiveBluetoothDeviceTab = props =>
  props.isMobile ? <MobileBluetoothDeviceTab {...props} /> : <BluetoothDeviceTab {...props} />;

export default ResponsiveBluetoothDeviceTab;
