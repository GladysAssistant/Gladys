import { Text } from 'preact-i18n';
import cx from 'classnames';

import EmptyState from './EmptyState';
import style from './style.css';
import CheckMqttPanel from '../../mqtt/commons/CheckMqttPanel';
import SonoffDeviceBox from '../SonoffDeviceBox';

const DeviceTab = ({ children, ...props }) => (
  <div class="card">
    <div class="card-header">
      <h1 class="card-title">
        <Text id="integration.sonoff.discover.title" />
      </h1>
    </div>
    <div class="card-body">
      <CheckMqttPanel />

      <div class="alert alert-secondary">
        <Text id="integration.sonoff.discover.description" />
      </div>
      <div
        class={cx('dimmer', {
          active: props.loading
        })}
      >
        <div class="loader" />
        <div class={cx('dimmer-content', style.sonoffListBody)}>
          {props.errorLoading && (
            <p class="alert alert-danger">
              <Text id="integration.sonoff.discover.error" />
            </p>
          )}
          <div class="row">
            {props.discoveredDevices &&
              props.discoveredDevices.map((device, index) => (
                <SonoffDeviceBox
                  {...props}
                  modifiable={!device.created_at}
                  alreadyCreatedButton={device.created_at}
                  saveButton={!device.created_at}
                  device={device}
                  deviceIndex={index}
                />
              ))}
            {!props.discoveredDevices || (props.discoveredDevices.length === 0 && <EmptyState />)}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default DeviceTab;
