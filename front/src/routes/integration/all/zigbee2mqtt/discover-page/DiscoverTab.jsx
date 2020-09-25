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
        <Text id="integration.zigbee2mqtt.discover.title" />
      </h1>
      <div class="page-options d-flex">
        <button class="btn btn-outline-primary" onClick={props.discover} disabled={props.discoverZigbee2mqtt}>
          <Text id="integration.zigbee2mqtt.discover.scanButton" /> <i class="fe fe-radio" />
        </button>
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
