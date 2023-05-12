import { Text } from 'preact-i18n';
import cx from 'classnames';

import { RequestStatus } from '../../../../../utils/consts';
import SunSpecDiscoverDevice from './SunSpecDiscoverDevice';
import EmptyState from '../EmptyState';
import style from '../style.css';

const SunSpecDiscoverTab = ({
  children,
  sunspecGetDiscoveredDevicesStatus,
  sunspecDiscoveredDevices = [],
  sunspecDiscoverUpdate = true,
  sunspecStatus = {},
  getDiscoveredDevices,
  scan,
  ...props
}) => {
  const { scanning } = sunspecStatus;
  const displayLoader = scanning && sunspecDiscoveredDevices.length === 0;

  return (
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">
          <Text id="integration.sunspec.discover.title" />
        </h3>
        <div class="page-options d-flex">
          {sunspecDiscoverUpdate && (
            <button class="btn btn-outline-success mr-2" onClick={getDiscoveredDevices}>
              <span class="d-none d-md-inline mr-2">
                <Text id="integration.sunspec.discover.deviceUpdateButton" />
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
              <Text id="integration.sunspec.discover.scanButton" />
            </span>
            <i class="fe fe-radio" />
          </button>
        </div>
      </div>
      {scanning && sunspecDiscoveredDevices.length > 0 && (
        <div class="progress progress-xs">
          <div class="progress-bar progress-bar-indeterminate" />
        </div>
      )}
      <div class="card-body">
        {sunspecGetDiscoveredDevicesStatus === RequestStatus.Error && (
          <div class="alert alert-danger">
            <Text id="integration.sunspec.discover.discoveringError" />
          </div>
        )}

        <div
          class={cx('dimmer', {
            active: displayLoader,
            [style.sunspecListBody]: displayLoader
          })}
        >
          <div class="loader" />
          <div class="dimmer-content">
            <div class="row">
              {sunspecDiscoveredDevices.map((sunspecDevice, index) => (
                <SunSpecDiscoverDevice
                  device={sunspecDevice}
                  deviceIndex={index}
                  houses={props.houses}
                  updateDeviceProperty={props.updateDeviceProperty}
                  saveDevice={props.saveDevice}
                />
              ))}
              {sunspecDiscoveredDevices.length === 0 && <EmptyState id="integration.sunspec.discover.noDevices" />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SunSpecDiscoverTab;
