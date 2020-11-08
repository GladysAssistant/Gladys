import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';

import EmptyState from './EmptyState';
import Zigbee2mqttBox from './Zigbee2mqttBox';
import { RequestStatus } from '../../../../../utils/consts';
import style from './style.css';
import CheckStatus from '../commons/CheckStatus';

const DeviceTab = ({ children, ...props }) => (
  <div class="card">
    <div class="card-header">
      <h1 class="card-title">
        <tr>
          <td class="text-right">
            <Text id="integration.zigbee2mqtt.device.title" />
          </td>
          <td>
            {props.zigbee2mqttDevices && <div>&nbsp;( {props.zigbee2mqttDevices.length} <Text id="integration.zigbee2mqtt.discover.device" /> )</div>}
          </td>
        </tr>
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
              placeholder={<Text id="integration.zigbee2mqtt.device.search" />}
              onInput={props.debouncedSearch}
            />
          </Localizer>
        </div>
      </div>
    </div>
    <div class="card-body">
      <CheckStatus />

      <div
        class={cx('dimmer', {
          active: props.getZigbee2mqttStatus === RequestStatus.Getting
        })}
      >
        <div class="loader" />
        <div class={cx('dimmer-content', style.zigbee2mqttListBody)}>
          <div class="row">
            {props.zigbee2mqttDevices &&
              props.zigbee2mqttDevices.map((device, index) => (
                <Zigbee2mqttBox {...props} device={device} deviceIndex={index} />
              ))}
            {props.zigbee2mqttDevices && props.zigbee2mqttDevices.length === 0 && <EmptyState />}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default DeviceTab;
