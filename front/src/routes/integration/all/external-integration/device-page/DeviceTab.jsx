import { Text } from 'preact-i18n';
import cx from 'classnames';

import DeviceBox from './DeviceBox';
import { RequestStatus } from '../../../../../utils/consts';

const DeviceTab = ({ devices, houses, getDevicesStatus, getDevices, updateDeviceField, saveDevice, deleteDevice }) => (
  <div class="card">
    <div class="card-header">
      <h1 class="card-title">
        <Text id="integration.externalIntegration.device.title" />
      </h1>
      <div class="page-options d-flex">
        <button class="btn btn-outline-primary btn-sm" onClick={getDevices}>
          <i class="fe fe-refresh-cw mr-1" />
          <Text id="integration.externalIntegration.device.refreshButton" />
        </button>
      </div>
    </div>
    <div class="card-body">
      {getDevicesStatus === RequestStatus.Error && (
        <div class="alert alert-danger">
          <Text id="integration.externalIntegration.device.loadError" />
        </div>
      )}
      <div
        class={cx('dimmer', {
          active: getDevicesStatus === RequestStatus.Getting
        })}
      >
        <div class="loader" />
        <div class="dimmer-content">
          <div class="row">
            {devices &&
              devices.map((device, index) => (
                <DeviceBox
                  key={device.id || device.external_id}
                  device={device}
                  deviceIndex={index}
                  houses={houses}
                  updateDeviceField={updateDeviceField}
                  saveDevice={saveDevice}
                  deleteDevice={deleteDevice}
                />
              ))}
          </div>
          {devices && devices.length === 0 && (
            <div class="text-center text-muted py-5">
              <Text id="integration.externalIntegration.device.noDevices" />
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);

export default DeviceTab;
