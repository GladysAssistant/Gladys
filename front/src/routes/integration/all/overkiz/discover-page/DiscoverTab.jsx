import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import cx from 'classnames';

import EmptyState from './EmptyState';
import style from './style.css';
import OverkizDeviceBox from '../OverkizDeviceBox';

const DeviceTab = ({ children, ...props }) => (
  <div class="card">
    <div class="card-header">
      <h1 class="card-title">
        <Text id="integration.overkiz.discover.title" />
      </h1>
      <div class="page-options d-flex">
        <button onClick={props.discoverOverkizDevices} class="btn btn-outline-primary ml-2" disabled={props.loading}>
          <Text id="integration.overkiz.discover.scan" /> <i class="fe fe-radio" />
        </button>
      </div>
    </div>
    <div class="card-body">
      <div class="alert alert-secondary">
        <Text id="integration.overkiz.discover.description" />
      </div>
      <div
        class={cx('dimmer', {
          active: props.loading
        })}
      >
        <div class="loader" />
        <div class={cx('dimmer-content', style.overkizListBody)}>
          {props.errorLoading && (
            <p class="alert alert-warning">
              <Text id="integration.overkiz.status.notConnected" />
              <Link href="/dashboard/integration/device/overkiz/settings-page">
                <Text id="integration.overkiz.status.settingsPageLink" />
              </Link>
            </p>
          )}
          <div class="row">
            {props.discoveredDevices &&
              props.discoveredDevices.map((device, index) => (
                <OverkizDeviceBox
                  {...props}
                  editable={false}
                  createButton={true}
                  updateButton={false}
                  deleteButton={false}
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
