import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';
import { Link } from 'preact-router/match';
import { RequestStatus } from '../../../../../utils/consts';
import ThermostatDeviceBox from './ThermostatDeviceBox';
import CardFilter from '../../../../../components/layout/CardFilter';

const DeviceTab = ({ ...props }) => (
  <div class="card">
    <div class="card-header">
      <h1 class="card-title">
        <Text id="integration.thermostat.device.title" />
      </h1>
      <div class="page-options d-flex">
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

export default DeviceTab;
