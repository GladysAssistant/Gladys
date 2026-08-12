import { Text } from 'preact-i18n';
import cx from 'classnames';

import { RequestStatus } from '../../../../../utils/consts';
import LANManagerDiscoverDevice from './LANManagerDiscoverDevice';
import EmptyState from '../EmptyState';
import style from '../style.css';

const LANManagerDiscoverTab = ({
  children,
  lanManagerGetDiscoveredDevicesStatus,
  lanManagerDiscoveredDevices = [],
  lanManagerDiscoverUpdate = true,
  lanManagerStatus = {},
  filterExisting = true,
  getDiscoveredDevices,
  scan,
  ...props
}) => {
  const { scanning } = lanManagerStatus;
  const displayLoader = scanning && lanManagerDiscoveredDevices.length === 0;

  return (
    <div class="card">
      <div class="card-header">
        <h1 class="card-title">
          <Text id="integration.lanManager.discover.title" />
        </h1>
        <div class="page-options d-flex">
          {lanManagerDiscoverUpdate && (
            <button class="btn btn-outline-success mr-2" onClick={getDiscoveredDevices}>
              <span class="d-none d-md-inline mr-2">
                <Text id="integration.lanManager.discover.deviceUpdateButton" />
              </span>
              <i class="fe fe-refresh-cw" />
            </button>
          )}
          <button
            class={cx('btn', {
              'btn-outline-danger': scanning,
              'btn-outline-primary': !scanning
            })}
            onClick={scan}
          >
            <span class="d-none d-md-inline mr-2">
              <Text id="integration.lanManager.discover.scanButton" />
            </span>
            <i class="fe fe-radio" />
          </button>
        </div>
      </div>
      <ul class="list-group list-group-flush">
        <li class="list-group-item">
          <label class="custom-switch">
            <input
              type="checkbox"
              class="custom-switch-input"
              checked={filterExisting}
              onClick={props.toggleFilterOnExisting}
              disabled={scanning}
            />
            <span class={cx('custom-switch-indicator', 'mr-1', { 'bg-light': scanning })} />
            <span class="custom-switch-description">
              <Text id="integration.lanManager.discover.hideExistingDevices" />
            </span>
          </label>
        </li>
      </ul>
      {scanning && lanManagerDiscoveredDevices.length > 0 && (
        <div class="progress progress-xs">
          <div class="progress-bar progress-bar-indeterminate" />
        </div>
      )}
      <div class="card-body">
        {lanManagerGetDiscoveredDevicesStatus === RequestStatus.Error && (
          <div class="alert alert-danger">
            <Text id="integration.lanManager.discover.discoveringError" />
          </div>
        )}

        <div
          class={cx('dimmer', {
            active: displayLoader,
            [style.lanManagerListBody]: displayLoader
          })}
        >
          <div class="loader" />
          <div class="dimmer-content">
            <div class="row">
              {lanManagerDiscoveredDevices.map((lanManagerDevice, index) => (
                <LANManagerDiscoverDevice
                  device={lanManagerDevice}
                  deviceIndex={index}
                  houses={props.houses}
                  updateDeviceProperty={props.updateDeviceProperty}
                  saveDevice={props.saveDevice}
                />
              ))}
              {lanManagerDiscoveredDevices.length === 0 && (
                <EmptyState id="integration.lanManager.discover.noDevices" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LANManagerDiscoverTab;
