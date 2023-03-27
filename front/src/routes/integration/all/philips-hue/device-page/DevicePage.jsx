import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';

import style from './style.css';
import { RequestStatus } from '../../../../../utils/consts';
import Device from './Device';
import CardFilter from '../../../../../components/layout/CardFilter';

const DeviceTab = ({ children, ...props }) => (
  <div class="card">
    <div class="card-header">
      <h3 class="card-title">
        <Text id="integration.philipsHue.device.title" />
      </h3>
      <div class="page-options d-flex">
        <Localizer>
          <CardFilter
            changeOrderDir={props.changeOrderDir}
            orderValue={props.getPhilipsHueDeviceOrderDir}
            search={props.debouncedSearch}
            searchValue={props.philipsHueDeviceSearch}
            searchPlaceHolder={<Text id="device.searchPlaceHolder" />}
          />
        </Localizer>
      </div>
    </div>
    <div class="card-body">
      <div
        class={cx('dimmer', {
          active: props.getPhilipsHueDevicesStatus === RequestStatus.Getting
        })}
      >
        <div class="loader" />
        <div class="dimmer-content">
          {props.getPhilipsHueDevicesStatus === RequestStatus.Getting && <div class={style.emptyDiv} />}
          <div class="row">
            {props.philipsHueDevices &&
              props.philipsHueDevices.map((device, index) => (
                <Device
                  device={device}
                  deviceIndex={index}
                  houses={props.houses}
                  updateDeviceProperty={props.updateDeviceProperty}
                  saveDevice={props.saveDevice}
                  deleteDevice={props.deleteDevice}
                />
              ))}
            {props.philipsHueDevices && props.philipsHueDevices.length === 0 && (
              <Text id="integration.philipsHue.device.noDevices" />
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default DeviceTab;
