import { Text, MarkupText } from 'preact-i18n';
import cx from 'classnames';

import EmptyState from './EmptyState';
import style from './style.css';
import YeelightDeviceBox from '../YeelightDeviceBox';

const DeviceTab = ({ children, ...props }) => (
  <div class="card">
    <div class="card-header">
      <h1 class="card-title">
        <Text id="integration.yeelight.discover.title" />
      </h1>
      <div class="page-options d-flex">
        <button
          onClick={props.getDiscoveredYeelightDevices}
          class="btn btn-outline-primary ml-2"
          disabled={props.loading}
        >
          <Text id="integration.yeelight.discover.scan" /> <i class="fe fe-radio" />
        </button>
      </div>
    </div>
    <div class="card-body">
      <div class="alert alert-secondary">
        <MarkupText id="integration.yeelight.discover.description" />
      </div>
      <div
        class={cx('dimmer', {
          active: props.loading
        })}
      >
        <div class="loader" />
        <div class={cx('dimmer-content', style.yeelightListBody)}>
          {props.errorLoading && (
            <p class="alert alert-danger">
              <Text id="integration.yeelight.discover.error" />
            </p>
          )}
          <div class="row">
            {props.discoveredDevices &&
              props.discoveredDevices.map((device, index) => (
                <YeelightDeviceBox
                  {...props}
                  editable={!device.created_at || device.updatable}
                  alreadyCreatedButton={device.created_at && !device.updatable}
                  updateButton={device.updatable}
                  saveButton={!device.created_at}
                  device={device}
                  deviceIndex={index}
                  listName="discoveredDevices"
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
