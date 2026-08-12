import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';

import { RequestStatus } from '../../../../utils/consts';
import Device from './Device';
import style from './style.css';
import CardFilter from '../../../../components/layout/CardFilter';

const DevicePanel = ({ children, ...props }) => (
  <div class="card">
    <div class="card-header">
      <h1 class="card-title">
        <Text id="integration.xiaomi.device.title" />
      </h1>
      <div class="page-options d-flex">
        <Localizer>
          <CardFilter
            changeOrderDir={props.changeOrderDir}
            orderValue={props.getXiaomiDeviceOrderDir}
            search={props.debouncedSearch}
            searchValue={props.xiaomiDeviceSearch}
            searchPlaceHolder={<Text id="device.searchPlaceHolder" />}
          />
        </Localizer>
      </div>
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
