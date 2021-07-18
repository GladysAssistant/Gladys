import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';

import EmptyState from './EmptyState';
import { RequestStatus } from '../../../../../utils/consts';
import style from './style.css';
import Zwave2mqttDeviceBox from '../Zwave2mqttDeviceBox';

const DeviceTab = ({ children, ...props }) => (
  <div class="card">
    <div class="card-header">
      <h1 class="card-title">
        <Text id="integration.zwave2mqtt.device.title" />
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
              placeholder={<Text id="integration.zwave2mqtt.device.search" />}
              onInput={props.debouncedSearchDevicesKeyword}
            />
          </Localizer>
        </div>
      </div>
    </div>
    <div class="card-body">
      <div
        class={cx('dimmer', {
          active: props.getZwave2mqttStatus === RequestStatus.Getting
        })}
      >
        <div class="loader" />
        <div class={cx('dimmer-content', style.zwave2mqttListBody)}>
          <div class="row">
            {props.zwave2mqttDevices &&
              props.zwave2mqttDevices.length > 0 &&
              props.zwave2mqttDevices.map((device, index) => (
                <Zwave2mqttDeviceBox
                  {...props}
                  editable
                  saveButton
                  deleteButton
                  editButton
                  device={device}
                  deviceIndex={index}
                  listName="zwave2mqttDevices"
                />
              ))}
            {!props.zwave2mqttDevices || (props.zwave2mqttDevices.length === 0 && <EmptyState />)}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default DeviceTab;
