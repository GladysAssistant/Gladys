import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';

import style from './style.css';
import { RequestStatus } from '../../../../../utils/consts';
import Device from './Device';
import { Link } from 'preact-router/match';
import CheckHeatzyPanel from '../commons/CheckHeatzyPanel';
import EmptyState from './EmptyState';

const DeviceTab = ({ children, ...props }) => (
  <div class="card">
    <div class="card-header">
      <h3 class="card-title">
        <Text id="integration.heatzy.device.title" />
      </h3>
      <div class="page-options d-flex">
        <select onChange={props.changeOrderDir} class="form-control custom-select w-auto">
          <option value="asc">
            <Text id="global.orderDirAsc" />
          </option>
          <option value="desc">
            <Text id="global.orderDirDesc" />
          </option>
        </select>
        <div class="input-icon ml-2">
          <span class="input-icon-addon">
            <i class="fe fe-search" />
          </span>
          <Localizer>
            <input
              type="text"
              class="form-control w-10"
              placeholder={<Text id="integration.heatzy.device.search" />}
              onInput={props.debouncedSearch}
            />
          </Localizer>
        </div>
        <Link href="/dashboard/integration/device/heatzy/edit">
          <button class="btn btn-outline-primary ml-2">
            <Text id="scene.newButton" /> <i class="fe fe-plus" />
          </button>
        </Link>
      </div>
    </div>
    <div class="card-body">
      <CheckHeatzyPanel />

      <div
        class={cx('dimmer', {
          active: props.getHeatzyDevicesStatus === RequestStatus.Getting
        })}
      >
        <div class="loader" />
        <div class={cx('dimmer-content', style.emptyDiv)}>
          {props.getHeatzyDevicesStatus === RequestStatus.Getting}
          <div class="row">
            {props.heatzyDevices &&
              props.heatzyDevices.map((heatzyDevice, index) => (
                <Device
                  device={heatzyDevice}
                  deviceIndex={index}
                  houses={props.houses}
                  updateDeviceProperty={props.updateDeviceProperty}
                  saveDevice={props.saveDevice}
                  deleteDevice={props.deleteDevice}
                />
              ))}
            {props.heatzyDevices && props.heatzyDevices.length === 0 && <EmptyState />}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default DeviceTab;
