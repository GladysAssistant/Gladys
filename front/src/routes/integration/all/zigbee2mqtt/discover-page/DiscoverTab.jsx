import { Text } from 'preact-i18n';
import cx from 'classnames';

import EmptyState from './EmptyState';
import DiscoveredBox from './DiscoveredBox';
import { RequestStatus } from '../../../../../utils/consts';
import style from './style.css';

const DiscoverTab = ({ children, ...props }) => (
  <div class="card">
    <div class="card-header">
      <h1 class="card-title">
        <Text id="integration.zigbee2mqtt.device.title" />
      </h1>
    </div>
    <div class="card-body">
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
                <DiscoveredBox {...props} device={device} deviceIndex={index} />
              ))}
            {props.zigbee2mqttDevices && props.zigbee2mqttDevices.length === 0 && <EmptyState />}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default DiscoverTab;
