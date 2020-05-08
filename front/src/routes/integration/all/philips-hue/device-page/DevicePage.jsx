import { Text } from 'preact-i18n';
import cx from 'classnames';

import style from './style.css';
import { RequestStatus } from '../../../../../utils/consts';
import Device from './Device';
import PageOptions from '../../../../../components/form/PageOptions';

const DeviceTab = ({ children, ...props }) => (
  <div class="card">
    <div class="card-header">
      <h3 class="card-title">
        <Text id="integration.philipsHue.device.title" />
      </h3>
      <PageOptions
        changeOrderDir={props.changeOrderDir}
        searchPlaceholder={<Text id="integration.philipsHue.device.search" />}
        debouncedSearch={props.debouncedSearch}
      />
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
