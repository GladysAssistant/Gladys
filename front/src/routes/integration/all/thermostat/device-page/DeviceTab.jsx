import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';
import get from 'get-value';
import { Link } from 'preact-router/match';
import { RequestStatus } from '../../../../../utils/consts';
import ThermostatDeviceBox from './ThermostatDeviceBox';
import CardFilter from '../../../../../components/layout/CardFilter';
import style from './style.css';
import withIntlAsProp from '../../../../../utils/withIntlAsProp';
import { MobileSectionHeader, MobileGroup, MobileEmptyState } from '../../../../../components/mobile';
import {
  MobileIntegrationTab,
  MobileListToolbar,
  MobileListLoader
} from '../../../../../components/integration/mobile';

// The thermostats on a phone (docs/specs/mobile-pages/integration-devices.md): one row per
// thermostat opening its sheet, and the creation as the floating "+". Same props as the card
// below.
const MobileDeviceTab = withIntlAsProp(({ intl, ...props }) => {
  const loading = props.getThermostatDevicesStatus === RequestStatus.Getting;
  const devices = props.thermostatDevices || [];
  return (
    <MobileIntegrationTab
      dataCy="thermostat-devices-mobile"
      fab={{
        href: '/dashboard/integration/device/thermostat/new',
        label: get(intl.dictionary, 'integration.thermostat.device.newButton'),
        dataCy: 'thermostat-device-create'
      }}
    >
      <MobileListToolbar
        searchValue={props.thermostatDeviceSearch}
        onSearch={props.search}
        orderDir={props.getThermostatDeviceOrderDir}
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
                <ThermostatDeviceBox
                  key={device.selector}
                  isMobile
                  device={device}
                  deviceIndex={index}
                  houses={props.houses}
                  thermostatSchedules={props.thermostatSchedules}
                  saveDevice={props.saveDevice}
                  deleteDevice={props.deleteDevice}
                  updateDeviceProperty={props.updateDeviceProperty}
                />
              ))}
            </MobileGroup>
          </div>
        )}
        {props.thermostatDevices && devices.length === 0 && !loading && (
          <MobileEmptyState icon="thermometer" text={<Text id="integration.thermostat.device.noDevices" />} />
        )}
      </MobileListLoader>
    </MobileIntegrationTab>
  );
});

const DeviceTab = ({ ...props }) => (
  <div class={cx('card', style.devicePage)}>
    <div class="card-header">
      <h1 class="card-title">
        <Text id="integration.thermostat.device.title" />
      </h1>
      <div class="page-options d-flex flex-wrap justify-content-end">
        <Localizer>
          <CardFilter
            changeOrderDir={props.changeOrderDir}
            orderValue={props.getThermostatDeviceOrderDir}
            search={props.search}
            searchValue={props.thermostatDeviceSearch}
            searchPlaceHolder={<Text id="device.searchPlaceHolder" />}
          />
        </Localizer>
        <Link href="/dashboard/integration/device/thermostat/new">
          <button class="btn btn-outline-primary ml-2">
            <Text id="integration.thermostat.device.newButton" /> <i class="fe fe-plus" />
          </button>
        </Link>
      </div>
    </div>
    <div class="card-body">
      <div class={cx('dimmer', { active: props.getThermostatDevicesStatus === RequestStatus.Getting })}>
        <div class="loader" />
        <div class="dimmer-content">
          <div class="row">
            {props.thermostatDevices &&
              props.thermostatDevices.map((device, index) => (
                <ThermostatDeviceBox
                  key={device.selector}
                  device={device}
                  deviceIndex={index}
                  houses={props.houses}
                  thermostatSchedules={props.thermostatSchedules}
                  saveDevice={props.saveDevice}
                  deleteDevice={props.deleteDevice}
                  updateDeviceProperty={props.updateDeviceProperty}
                />
              ))}
            {props.thermostatDevices &&
              props.thermostatDevices.length === 0 &&
              props.getThermostatDevicesStatus !== RequestStatus.Getting && (
                <div class="col-12">
                  <p class="text-muted">
                    <Text id="integration.thermostat.device.noDevices" />
                  </p>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  </div>
);

const ResponsiveDeviceTab = props => (props.isMobile ? <MobileDeviceTab {...props} /> : <DeviceTab {...props} />);

export default ResponsiveDeviceTab;
