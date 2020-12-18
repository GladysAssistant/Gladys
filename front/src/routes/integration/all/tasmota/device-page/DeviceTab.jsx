import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';

import EmptyState from './EmptyState';
import { RequestStatus } from '../../../../../utils/consts';
import style from './style.css';
import TasmotaDeviceBox from '../TasmotaDeviceBox';

const DeviceTab = ({ children, ...props }) => (
  <div class="card">
    <div class="card-header">
      <h1 class="card-title">
        <Text id="integration.tasmota.device.title" />
      </h1>
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
              placeholder={<Text id="integration.tasmota.device.search" />}
              onInput={props.debouncedSearch}
            />
          </Localizer>
        </div>
      </div>
    </div>
    <div class="card-body">
      <div
        class={cx('dimmer', {
          active: props.getTasmotaStatus === RequestStatus.Getting
        })}
      >
        <div class="loader" />
        <div class={cx('dimmer-content', style.tasmotaListBody)}>
          <div class="row">
            {props.tasmotaDevices &&
              props.tasmotaDevices.length > 0 &&
              props.tasmotaDevices.map((device, index) => (
                <TasmotaDeviceBox
                  {...props}
                  editable
                  saveButton
                  deleteButton
                  editButton
                  device={device}
                  deviceIndex={index}
                  listName="tasmotaDevices"
                />
              ))}
            {!props.tasmotaDevices || (props.tasmotaDevices.length === 0 && <EmptyState />)}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default DeviceTab;
