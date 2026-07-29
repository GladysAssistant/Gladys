import { Text, MarkupText } from 'preact-i18n';
import cx from 'classnames';
import get from 'get-value';

import DeviceBox from './DeviceBox';
import { RequestStatus } from '../../../../../utils/consts';

const DeviceTab = ({
  selector,
  integration,
  devices,
  houses,
  language,
  getDevicesStatus,
  getDevices,
  updateDeviceField,
  saveDevice,
  deleteDevice
}) => {
  // first-run guidance: an integration with settings probably needs them
  // filled before anything shows up here
  const hasConfigSchema = (get(integration, 'manifest.config_schema') || []).length > 0;
  return (
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
                    language={language}
                    updateDeviceField={updateDeviceField}
                    saveDevice={saveDevice}
                    deleteDevice={deleteDevice}
                  />
                ))}
            </div>
            {devices && devices.length === 0 && (
              <div class="text-center text-muted py-5">
                <Text id="integration.externalIntegration.device.noDevices" />
                {hasConfigSchema && (
                  <div class="mt-2">
                    <MarkupText
                      id="integration.externalIntegration.device.noDevicesConfigureFirst"
                      fields={{ configUrl: `/dashboard/integration/device/external/${selector}/config` }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeviceTab;
