import { Text } from 'preact-i18n';
import cx from 'classnames';

import { RequestStatus } from '../../../../utils/consts';
import Device from './Device';
import style from './style.css';
import PageOptions from '../../../../components/form/PageOptions';

const DevicePanel = ({ children, ...props }) => (
  <div class="card">
    <div class="card-header">
      <h3 class="card-title">
        <Text id="integration.xiaomi.device.title" />
      </h3>
      <PageOptions
        changeOrderDir={props.changeOrderDir}
        searchPlaceholder={<Text id="integration.xiaomi.device.searchPlaceholder" />}
        debouncedSearch={props.debouncedSearch}
      />
    </div>
    <div class="card-body">
      <div
        class={cx('dimmer', {
          active: props.getXiaomiDevicesStatus === RequestStatus.Getting
        })}
      >
        <div class="loader" />
        <div class="dimmer-content">
          {props.getXiaomiDevicesStatus === RequestStatus.Getting && <div class={style.emptyDiv} />}
          <div class="row">
            {props.xiaomiDevices &&
              props.xiaomiDevices.map((xiaomiDevice, index) => (
                <Device
                  device={xiaomiDevice}
                  deviceIndex={index}
                  houses={props.houses}
                  updateDeviceProperty={props.updateDeviceProperty}
                  saveDevice={props.saveDevice}
                  deleteDevice={props.deleteDevice}
                />
              ))}
            {props.xiaomiDevices && props.xiaomiDevices.length === 0 && (
              <p class="text-center">
                <Text id="integration.xiaomi.device.noDevices" />
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default DevicePanel;
