import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';

import SortSelect from '../../../../../components/layout/SortSelect';
import { RequestStatus } from '../../../../../utils/consts';
import LANManagerDevice from './LANManagerDevice';
import EmptyState from '../EmptyState';
import style from '../style.css';
import { MobileSectionHeader, MobileGroup, MobileNotice, MobileEmptyState } from '../../../../../components/mobile';
import {
  MobileIntegrationTab,
  MobileListToolbar,
  MobileListLoader,
  integrationMobileStyle
} from '../../../../../components/integration/mobile';

// The devices on a phone (docs/specs/mobile-pages/integration-devices.md): one row per device,
// opening the sheet that holds what its card holds. Same props as the card below.
const MobileLANManagerDeviceTab = ({ getLANManagerDevicesStatus, lanManagerDevices, ...props }) => {
  const loading = getLANManagerDevicesStatus === RequestStatus.Getting;
  const devices = lanManagerDevices || [];
  return (
    <MobileIntegrationTab dataCy="lan-manager-devices-mobile">
      <MobileListToolbar
        onSearch={props.debouncedSearch}
        // the search is debounced: the field is not controlled, it only starts from the query
        // still applied to the list when it mounts again
        initialSearchValue={props.lanManagerDeviceSearch}
        searchPlaceholderId="integration.lanManager.device.search"
        orderDir={props.getLANManagerDeviceOrderDir}
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
              {devices.map((lanManagerDevice, index) => (
                <LANManagerDevice
                  key={lanManagerDevice.selector}
                  isMobile
                  device={lanManagerDevice}
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
          <MobileEmptyState icon="wifi" text={<Text id="integration.lanManager.device.noDevices" />} />
        )}
      </MobileListLoader>
      {/* what the integration is for comes after the devices, which are what one comes for */}
      <div class={integrationMobileStyle.afterList}>
        <MobileNotice icon="info">
          <Text id="integration.lanManager.device.explanation" />
          <br />
          <strong>
            <Text id="integration.lanManager.device.iosWarning" />
          </strong>
        </MobileNotice>
      </div>
    </MobileIntegrationTab>
  );
};

const LANManagerDeviceTab = ({ children, getLANManagerDevicesStatus, lanManagerDevices, ...props }) => (
  <div class="card">
    <div class="card-header">
      <h1 class="card-title">
        <Text id="integration.lanManager.device.title" />
      </h1>
      <div class="page-options d-flex">
        <SortSelect
          value={props.getLANManagerDeviceOrderDir || 'asc'}
          onChange={props.changeOrderDir}
          options={[
            { value: 'asc', labelId: 'global.orderDirAsc' },
            { value: 'desc', labelId: 'global.orderDirDesc' }
          ]}
        />
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
      <div class="alert alert-info">
        <Text id="integration.lanManager.device.explanation" />
        <br />
        <b>
          <Text id="integration.lanManager.device.iosWarning" />
        </b>
      </div>
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
                  key={lanManagerDevice.selector}
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

const ResponsiveLANManagerDeviceTab = props =>
  props.isMobile ? <MobileLANManagerDeviceTab {...props} /> : <LANManagerDeviceTab {...props} />;

export default ResponsiveLANManagerDeviceTab;
