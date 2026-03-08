import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import cx from 'classnames';

import EmptyState from './EmptyState';
import style from './style.css';
import EweLinkDeviceBox from '../EweLinkDeviceBox';

const DeviceTab = ({ children, ...props }) => (
  <div class="card">
    <div class="card-header">
      <h1 class="card-title">
        <Text id="integration.eWeLink.discover.title" />
      </h1>
      <div class="page-options d-flex">
        <button
          onClick={props.getDiscoveredEweLinkDevices}
          class="btn btn-outline-primary ml-2"
          disabled={props.loading}
        >
          <Text id="integration.eWeLink.discover.scan" /> <i class="fe fe-radio" />
        </button>
      </div>
    </div>
    <div class="card-body">
      <div class="alert alert-secondary">
        <Text id="integration.eWeLink.discover.description" />
      </div>
      <div
        class={cx('dimmer', {
          active: props.loading
        })}
      >
        <div class="loader" />
        <div class={cx('dimmer-content', style.eweLinkListBody)}>
          {props.errorLoading && (
            <p class="alert alert-warning">
              <Text id="integration.eWeLink.status.notConnected" />
              <Link href="/dashboard/integration/device/ewelink/setup">
                <Text id="integration.eWeLink.status.setupPageLink" />
              </Link>
            </p>
          )}
          <div class="row">
            {props.discoveredDevices &&
              props.discoveredDevices.map((device, index) => (
                <EweLinkDeviceBox
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
