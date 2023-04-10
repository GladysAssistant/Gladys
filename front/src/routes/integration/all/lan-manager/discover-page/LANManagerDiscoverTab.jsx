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
  const loading = lanManagerGetDiscoveredDevicesStatus === RequestStatus.Getting;

  return (
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">
          <Text id="integration.lanManager.discover.title" />
        </h3>
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
              'btn-outline-danger': lanManagerStatus.scanning,
              'btn-outline-primary': !lanManagerStatus.scanning
            })}
            onClick={scan}
            disabled={lanManagerStatus.scanning}
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
              disabled={loading}
            />
            <span class="custom-switch-indicator mr-1" />
            <span class="custom-switch-description">
              <Text id="integration.lanManager.discover.hideExistingDevices" />
            </span>
          </label>
        </li>
      </ul>
      <div class="card-body">
        {lanManagerGetDiscoveredDevicesStatus === RequestStatus.Error && (
          <div class="alert alert-danger">
            <Text id="integration.lanManager.discover.discoveringError" />
          </div>
        )}

        <div
          class={cx('dimmer', {
            active: loading,
            [style.lanManagerListBody]: loading
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
