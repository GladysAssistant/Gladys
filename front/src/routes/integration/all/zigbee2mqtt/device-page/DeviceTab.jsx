import { Text, Localizer, MarkupText } from 'preact-i18n';
import cx from 'classnames';

import EmptyState from './EmptyState';
import Zigbee2mqttBox from './Zigbee2mqttBox';
import { RequestStatus } from '../../../../../utils/consts';
import style from './style.css';
import CheckStatus from '../commons/CheckStatus';
import CardFilter from '../../../../../components/layout/CardFilter';
import { MobileSectionHeader, MobileGroup, MobileEmptyState, BigButton } from '../../../../../components/mobile';
import {
  MobileIntegrationTab,
  MobileListToolbar,
  MobileListLoader,
  MobileTextNotice,
  integrationMobileStyle
} from '../../../../../components/integration/mobile';

// The devices on a phone (docs/specs/mobile-pages/integration-devices.md): the status of
// Zigbee2MQTT first, then one row per device opening the sheet that holds what its card holds.
// Same props as the card below.
const MobileDeviceTab = ({ zigbee2mqttDevices, getZigbee2mqttStatus, ...props }) => {
  const loading = getZigbee2mqttStatus === RequestStatus.Getting;
  const devices = zigbee2mqttDevices || [];
  return (
    <MobileIntegrationTab dataCy="z2m-devices-mobile">
      <CheckStatus isMobile />
      <MobileListToolbar
        searchValue={props.zigbee2mqttSearch}
        onSearch={props.search}
        orderDir={props.getZigbee2mqttOrderDir}
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
              {devices.map((device, index) => (
                <Zigbee2mqttBox
                  key={device.external_id}
                  isMobile
                  device={device}
                  deviceIndex={index}
                  houses={props.houses}
                  z2mUrl={props.z2mUrl}
                  updateDeviceField={props.updateDeviceField}
                  saveDevice={props.saveDevice}
                  deleteDevice={props.deleteDevice}
                />
              ))}
            </MobileGroup>
          </div>
        )}
        {zigbee2mqttDevices && devices.length === 0 && !loading && (
          <MobileEmptyState icon="radio" text={<Text id="integration.zigbee2mqtt.noDeviceFound" />}>
            {props.z2mConfigured !== false && (
              <BigButton
                variant="primary"
                icon="radio"
                href="/dashboard/integration/device/zigbee2mqtt/discover"
                data-cy="z2m-devices-discover"
              >
                <Text id="integration.zigbee2mqtt.discoverTab" />
              </BigButton>
            )}
          </MobileEmptyState>
        )}
      </MobileListLoader>
      {/* The links to the Zigbee2MQTT interface are only in the sheets: what is missing for them
          comes after the devices, which are what one comes for. Not installed: the notice of
          CheckStatus is the only one */}
      {props.showZ2mUrlWarning && props.z2mConfigured !== false && (
        <div class={integrationMobileStyle.afterList}>
          <MobileTextNotice icon="info" data-cy="z2m-url-warning">
            <MarkupText id="integration.zigbee2mqtt.noZ2mUrlMessage" />
          </MobileTextNotice>
        </div>
      )}
    </MobileIntegrationTab>
  );
};

const DeviceTab = ({ children, ...props }) => (
  <div class="card">
    <div class="card-header">
      <h1 class="card-title">
        <Text id="integration.zigbee2mqtt.device.title" />
      </h1>
      <div class="page-options d-flex">
        <Localizer>
          <CardFilter
            changeOrderDir={props.changeOrderDir}
            orderValue={props.getZigbee2mqttOrderDir}
            search={props.search}
            searchValue={props.zigbee2mqttSearch}
            searchPlaceHolder={<Text id="device.searchPlaceHolder" />}
          />
        </Localizer>
      </div>
    </div>
    <div class="card-body">
      {/* Not installed: the banner of CheckStatus is the only one */}
      {props.showZ2mUrlWarning && props.z2mConfigured !== false && (
        <div class="alert alert-info mb-4" data-cy="z2m-url-warning">
          <MarkupText id="integration.zigbee2mqtt.noZ2mUrlMessage" />
        </div>
      )}
      <CheckStatus />

      <div
        class={cx('dimmer', {
          active: props.getZigbee2mqttStatus === RequestStatus.Getting
        })}
      >
        <div class="loader" />
        <div class={cx('dimmer-content', style.zigbee2mqttListBody)}>
          <div class="row">
            {props.zigbee2mqttDevices &&
              props.zigbee2mqttDevices.map((device, index) => (
                <Zigbee2mqttBox {...props} key={device.id || device.external_id} device={device} deviceIndex={index} />
              ))}
            {props.zigbee2mqttDevices && props.zigbee2mqttDevices.length === 0 && <EmptyState />}
          </div>
        </div>
      </div>
    </div>
  </div>
);

const ResponsiveDeviceTab = props => (props.isMobile ? <MobileDeviceTab {...props} /> : <DeviceTab {...props} />);

export default ResponsiveDeviceTab;
