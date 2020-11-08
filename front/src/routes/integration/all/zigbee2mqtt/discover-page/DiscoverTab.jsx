import { Text } from 'preact-i18n';
import cx from 'classnames';

import EmptyState from './EmptyState';
import DiscoveredBox from './DiscoveredBox';
import { RequestStatus } from '../../../../../utils/consts';
import style from './style.css';
import CheckStatus from '../commons/CheckStatus';

const DiscoverTab = ({ children, ...props }) => (
  <div class="card">
    <div class="card-header">
      <h1 class="card-title">
        <tr>
          <td class="text-right">
            <a href={props.zigbee2mqttFrontend} target="_blank"><Text id="integration.zigbee2mqtt.discover.title" /></a> 
          </td>
          <td>
            {props.zigbee2mqttDevices && <div>&nbsp;( {props.zigbee2mqttDevices.length} <Text id="integration.zigbee2mqtt.discover.device" /> )</div>}
          </td>
        </tr>
      </h1>
      <div class="page-options d-flex">
        <tr>
          <td class="text-right">
            <label>
              <input
                type="checkbox"
                class="custom-switch-input"
                checked={props.permitJoin}
                onClick={props.togglePermitJoin}
              />
              <span class="custom-switch-indicator" />
            </label>
          </td>
          <td>
            &nbsp;<Text id="integration.zigbee2mqtt.discover.permitJoin" />
            &nbsp;&nbsp;&nbsp;
          </td>
          <td>
            <button class="btn btn-outline-primary" onClick={props.discover} disabled={props.discoverZigbee2mqtt}>
              <Text id="integration.zigbee2mqtt.discover.scanButton" /> <i class="fe fe-radio" />
            </button>
          </td>
        </tr>
      </div>
    </div>
    <div class="card-body">
      <CheckStatus />

      {props.discoverZigbee2mqttError && (
        <div class="alert alert-danger">
          <Text id={props.discoverZigbee2mqttError} />
        </div>
      )}

      <div
        class={cx('dimmer', {
          active: props.discoverZigbee2mqtt
        })}
      >
        <div class="loader" />
        <div class={cx('dimmer-content', style.zigbee2mqttListBody)}>
          <div class="row">
            {props.zigbee2mqttDevices &&
              props.zigbee2mqttDevices.map((device, index) => (
                <DiscoveredBox {...props} device={device} deviceIndex={index} />
              ))}
            {!props.zigbee2mqttDevices || (props.zigbee2mqttDevices.length === 0 && <EmptyState />)}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default DiscoverTab;
