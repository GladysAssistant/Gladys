import { Text, MarkupText, Localizer } from 'preact-i18n';
import cx from 'classnames';
import get from 'get-value';

import DiscoveredBox from './DiscoveredBox';
import { RequestStatus } from '../../../../../utils/consts';

// client-side filter: the discovered list is already fully loaded (a
// network integration can publish ~1000 devices, one per client on the
// network) and never paginated server-side
const matchesSearch = (device, search) =>
  device.name.toLowerCase().includes(search) || device.external_id.toLowerCase().includes(search);

const DiscoverTab = ({
  selector,
  integration,
  discoveredDevices,
  deviceSearch,
  searchDevices,
  getDiscoveredDevicesStatus,
  scanStatus,
  scanError,
  scan,
  createDevice
}) => {
  const search = (deviceSearch || '').trim().toLowerCase();
  const filteredDevices =
    discoveredDevices && search ? discoveredDevices.filter(device => matchesSearch(device, search)) : discoveredDevices;
  return (
    <div class="card">
      <div class="card-header">
        <h1 class="card-title">
          <Text id="integration.externalIntegration.discover.title" />
        </h1>
        <div class="page-options d-flex">
          <div class="input-icon mr-2">
            <span class="input-icon-addon">
              <i class="fe fe-search" />
            </span>
            <Localizer>
              <input
                type="text"
                class="form-control"
                placeholder={<Text id="integration.externalIntegration.discover.searchPlaceholder" />}
                onInput={searchDevices}
              />
            </Localizer>
          </div>
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
              {filteredDevices &&
                filteredDevices.map(device => (
                  <DiscoveredBox key={device.external_id} device={device} createDevice={createDevice} />
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
            {discoveredDevices && discoveredDevices.length > 0 && filteredDevices.length === 0 && (
              <div class="text-center text-muted py-5">
                <Text id="integration.externalIntegration.discover.noSearchResults" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiscoverTab;
