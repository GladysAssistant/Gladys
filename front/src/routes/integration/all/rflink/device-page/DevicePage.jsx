import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';

import { RequestStatus } from '../../../../../utils/consts';
import Device from './Device';
import { Link } from 'preact-router/match';
import style from './style.css';

const NodeTab = ({ children, ...props }) => (
  <div class="card">
    <div class="card-header">
      <h3 class="card-title">
        <Text id="integration.rflink.device.title" />
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
              placeholder={<Text id="integration.rflink.device.search" />}
              onInput={props.debouncedSearch}
            />
          </Localizer>
        </div>
        <Link href="/dashboard/integration/device/rflink/edit">
          <button class="btn btn-outline-primary ml-2">
            <Text id="integration.rflink.device.newButton" /> <i class="fe fe-plus" />
          </button>
        </Link>
      </div>
    </div>
    <div class="card-body">
      <div
        class={cx('dimmer', {
          active: props.getRflinkDevicesStatus === RequestStatus.Getting
        })}
      >
        <div class="loader" />
        <div class="dimmer-content">
          {props.rflinkDevices && props.rflinkDevices.length === 0 && (
            <div class="alert alert-info">
              <Text id="integration.rflink.device.noDevices" />
            </div>
          )}
          {props.getRflinkDevicesStatus === RequestStatus.Getting && <div class={style.emptyDiv} />}
          <div class="row">
            {props.rflinkDevices &&
              props.rflinkDevices.map((rflinkDevice, index) => (
                <Device
                  device={rflinkDevice}
                  deviceIndex={index}
                  houses={props.houses}
                  updateDeviceProperty={props.updateDeviceProperty}
                  saveDevice={props.saveDevice}
                  deleteDevice={props.deleteDevice}
                />
              ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default NodeTab;
