import { Text, MarkupText } from 'preact-i18n';
import cx from 'classnames';
import get from 'get-value';

import DiscoveredBox from './DiscoveredBox';
import { RequestStatus } from '../../../../../utils/consts';

const DiscoverTab = ({
  selector,
  integration,
  discoveredDevices,
  getDiscoveredDevicesStatus,
  scanStatus,
  scanError,
  scan,
  createDevice
}) => (
  <div class="card">
    <div class="card-header">
      <h1 class="card-title">
        <Text id="integration.externalIntegration.discover.title" />
      </h1>
      <div class="page-options d-flex">
        <button class="btn btn-outline-primary btn-sm" onClick={scan} disabled={scanStatus === RequestStatus.Getting}>
          <i class="fe fe-radio mr-1" />
          {scanStatus === RequestStatus.Getting ? (
            <Text id="integration.externalIntegration.discover.scanning" />
          ) : (
            <Text id="integration.externalIntegration.discover.scanButton" />
          )}
        </button>
      </div>
    </div>
    <div class="card-body">
      {scanError && (
        <div class="alert alert-danger">
          <Text id={scanError} />
        </div>
      )}
      {getDiscoveredDevicesStatus === RequestStatus.Error && (
        <div class="alert alert-danger">
          <Text id="integration.externalIntegration.discover.loadError" />
        </div>
      )}
      <div
        class={cx('dimmer', {
          active: getDiscoveredDevicesStatus === RequestStatus.Getting
        })}
      >
        <div class="loader" />
        <div class="dimmer-content">
          <div class="row">
            {discoveredDevices &&
              discoveredDevices.map((device, index) => (
                <DiscoveredBox
                  key={device.external_id}
                  device={device}
                  deviceIndex={index}
                  createDevice={createDevice}
                />
              ))}
          </div>
          {discoveredDevices && discoveredDevices.length === 0 && (
            <div class="text-center text-muted py-5">
              <Text id="integration.externalIntegration.discover.noDevices" />
              {(get(integration, 'manifest.config_schema') || []).length > 0 && (
                <div class="mt-2">
                  <MarkupText
                    id="integration.externalIntegration.discover.noDevicesConfigureFirst"
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

export default DiscoverTab;
