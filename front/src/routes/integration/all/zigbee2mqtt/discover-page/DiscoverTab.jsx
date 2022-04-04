import { Text } from 'preact-i18n';
import cx from 'classnames';

import EmptyDeviceList from '../../../../../components/device/view/EmptyDeviceList';
import DiscoveredBox from './DiscoveredBox';
import CheckStatus from '../commons/CheckStatus';

const DiscoverTab = ({ children, ...props }) => (
  <div class="card">
    <div class="card-header">
      <h1 class="card-title">
        <Text id="integration.zigbee2mqtt.discover.title" />
      </h1>
      <div class="page-options d-flex">
        <label class="custom-switch">
          <input
            type="checkbox"
            id="permitJoin"
            name="permitJoin"
            class="custom-switch-input"
            checked={props.permitJoin}
            onClick={props.togglePermitJoin}
            disabled={!props.zigbee2mqttConnected || !props.gladysConnected}
          />
          <span class="custom-switch-indicator" />
          <span class="custom-switch-description">
            <Text id="integration.zigbee2mqtt.discover.permitJoin" />
          </span>
        </label>
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
        <div class="dimmer-content">
          <div class="row">
            {props.zigbee2mqttDevices &&
              props.zigbee2mqttDevices.map((device, index) => (
                <DiscoveredBox {...props} device={device} deviceIndex={index} />
              ))}
            {(!props.zigbee2mqttDevices || props.zigbee2mqttDevices.length === 0) && (
              <EmptyDeviceList>
                <Text id="integration.zigbee2mqtt.discover.noDeviceDiscovered" />
              </EmptyDeviceList>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default DiscoverTab;
