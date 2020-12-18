import { Text } from 'preact-i18n';
import cx from 'classnames';

import EmptyState from '../EmptyState';
import style from '../style.css';
import TasmotaDeviceBox from '../TasmotaDeviceBox';
import SearchForm from './SearchForm';

const DeviceTab = props => (
  <div class="card">
    <div class="card-header">
      <h1 class="card-title">
        <Text id="integration.tasmota.discover.http.title" />
      </h1>
    </div>
    <div class="card-body">
      <div
        class={cx('dimmer', {
          active: props.loading
        })}
      >
        <div class="loader" />
        <div class={cx('dimmer-content', style.tasmotaListBody)}>
          {props.errorLoading && (
            <p class="alert alert-danger">
              <Text id="integration.tasmota.discover.error" />
            </p>
          )}
          <SearchForm {...props} />
          <hr />
          <div class="row">
            {props.discoveredDevices &&
              props.discoveredDevices.map((device, index) => (
                <TasmotaDeviceBox
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
