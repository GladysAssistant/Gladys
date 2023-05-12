import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';

import { RequestStatus } from '../../../../../utils/consts';
import SunSpecDevice from './SunSpecDevice';
import EmptyState from '../EmptyState';
import style from '../style.css';
import CardFilter from '../../../../../components/layout/CardFilter';

const SunSpecDeviceTab = ({ children, getSunSpecDevicesStatus, sunspecDevices, ...props }) => (
  <div class="card">
    <div class="card-header">
      <h3 class="card-title">
        <Text id="integration.sunspec.device.title" />
      </h3>
      <div class="page-options d-flex">
        <Localizer>
          <CardFilter
            changeOrderDir={props.changeOrderDir}
            orderValue={props.getZigbee2mqttOrderDir}
            search={props.debouncedSearch}
            searchValue={props.sunspecDeviceSearch}
            searchPlaceHolder={<Text id="device.searchPlaceHolder" />}
          />
        </Localizer>
      </div>
    </div>
    <div class="card-body">
      <div
        class={cx('dimmer', {
          active: getSunSpecDevicesStatus === RequestStatus.Getting,
          [style.sunspecListBody]: getSunSpecDevicesStatus === RequestStatus.Getting
        })}
      >
        <div class="loader" />
        <div class="dimmer-content">
          <div class="row">
            {sunspecDevices &&
              sunspecDevices.map((sunspecDevice, index) => (
                <SunSpecDevice
                  device={sunspecDevice}
                  deviceIndex={index}
                  houses={props.houses}
                  updateDeviceProperty={props.updateDeviceProperty}
                  saveDevice={props.saveDevice}
                  deleteDevice={props.deleteDevice}
                />
              ))}
            {(!sunspecDevices || sunspecDevices.length === 0) && (
              <EmptyState id="integration.sunspec.device.noDevices" />
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default SunSpecDeviceTab;
