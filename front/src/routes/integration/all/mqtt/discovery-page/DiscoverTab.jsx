import { Text, MarkupText } from 'preact-i18n';
import cx from 'classnames';

import EmptyState from './EmptyState';
import DiscoveredBox from './DiscoveredBox';
import CheckMqttPanel from '../commons/CheckMqttPanel';
import style from './style.css';

const DiscoverTab = props => (
  <div class="card">
    <div class="card-header">
      <h1 class="card-title">
        <Text id="integration.mqtt.discover.title" />
      </h1>
      <div class="page-options d-flex">
        <button
          class="btn btn-outline-primary ml-2"
          onClick={props.getDiscoveredDevices}
          disabled={props.mqttDiscoveryLoading}
        >
          <Text id="integration.mqtt.discover.refreshButton" /> <i class="fe fe-refresh-cw" />
        </button>
      </div>
    </div>
    <ul class="list-group list-group-flush">
      <li class="list-group-item">
        <label class="custom-switch">
          <input
            type="checkbox"
            class="custom-switch-input"
            checked={props.mqttDiscoveryFilterExisting === undefined || props.mqttDiscoveryFilterExisting}
            onClick={props.toggleFilterOnExisting}
            disabled={props.mqttDiscoveryLoading}
          />
          <span class={cx('custom-switch-indicator', 'mr-1', { 'bg-light': props.mqttDiscoveryLoading })} />
          <span class="custom-switch-description">
            <Text id="integration.mqtt.discover.hideExistingDevices" />
          </span>
        </label>
      </li>
    </ul>
    <div class="card-body">
      <div class="alert alert-secondary">
        <MarkupText id="integration.mqtt.discover.description" />
      </div>
      <CheckMqttPanel />

      {props.mqttDiscoveryError && (
        <div class="alert alert-danger">
          <Text id={props.mqttDiscoveryError} />
        </div>
      )}

      <div
        class={cx('dimmer', {
          active: props.mqttDiscoveryLoading
        })}
      >
        <div class="loader" />
        <div class={cx('dimmer-content', style.mqttDiscoveryListBody)}>
          <div class="row">
            {props.mqttDiscoveredDevices &&
              props.mqttDiscoveredDevices.map((device, index) => (
                <DiscoveredBox {...props} device={device} deviceIndex={index} />
              ))}
            {(!props.mqttDiscoveredDevices || props.mqttDiscoveredDevices.length === 0) && <EmptyState />}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default DiscoverTab;
