import { Text } from 'preact-i18n';
import cx from 'classnames';

import CheckMqttPanel from '../../mqtt/commons/CheckMqttPanel';
import TasmotaDeviceBox from '../TasmotaDeviceBox';
import IntegrationEmptyState from '../../../../../components/integration/IntegrationEmptyState';

const DeviceTab = ({ children, ...props }) => (
  <div class="card">
    <div class="card-header">
      <h1 class="card-title">
        <Text id="integration.tasmota.discover.title" />
      </h1>
      <div class="page-options d-flex">
        <button onClick={props.forceScan} class="btn btn-outline-primary ml-2" disabled={props.loading}>
          <Text id="integration.tasmota.discover.scan" /> <i class="fe fe-radio" />
        </button>
      </div>
    </div>
    <div class="card-body">
      <CheckMqttPanel />

      <div class="alert alert-secondary">
        <Text id="integration.tasmota.discover.description" />
      </div>
      <div
        class={cx('dimmer', {
          active: props.loading
        })}
      >
        <div class="loader" />
        <div class="dimmer-content deviceList">
          {props.errorLoading && (
            <p class="alert alert-danger">
              <Text id="integration.tasmota.discover.error" />
            </p>
          )}
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
            {(!props.discoveredDevices || props.discoveredDevices.length === 0) && (
              <IntegrationEmptyState>
                <Text id="integration.tasmota.discover.noDeviceFound" />
              </IntegrationEmptyState>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default DeviceTab;
