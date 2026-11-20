import { Text, MarkupText, Localizer } from 'preact-i18n';
import cx from 'classnames';
import get from 'get-value';

import DiscoveredBox from './DiscoveredBox';
import style from './style.css';
import { RequestStatus } from '../../../../../utils/consts';
import {
  MobileSectionHeader,
  MobileGroup,
  MobileNotice,
  MobileEmptyState,
  BigButton,
  kitStyle
} from '../../../../../components/mobile';
import {
  MobileIntegrationTab,
  MobileListToolbar,
  MobileListLoader,
  MobileWaitingNotice,
  integrationMobileStyle
} from '../../../../../components/integration/mobile';

// client-side filter: the discovered list is already fully loaded (a
// network integration can publish ~1000 devices, one per client on the
// network) and never paginated server-side
const matchesSearch = (device, search) =>
  device.name.toLowerCase().includes(search) || device.external_id.toLowerCase().includes(search);

// an added device stays listed while it waits for its "Update" (re-published
// with a different structure): hiding it would hide the only way to apply it
const isAddedAndUpToDate = device => device.created && !device.structure_changed;

const DiscoverTab = ({
  selector,
  integration,
  discoveredDevices,
  deviceSearch,
  searchDevices,
  hideExistingDevices,
  toggleHideExistingDevices,
  getDiscoveredDevicesStatus,
  scanStatus,
  scanError,
  scan,
  createDevice,
  isMobile
}) => {
  const search = (deviceSearch || '').trim().toLowerCase();
  const visibleDevices =
    discoveredDevices && hideExistingDevices
      ? discoveredDevices.filter(device => !isAddedAndUpToDate(device))
      : discoveredDevices;
  const filteredDevices =
    visibleDevices && search ? visibleDevices.filter(device => matchesSearch(device, search)) : visibleDevices;
  const scanning = scanStatus === RequestStatus.Getting;
  // On a phone: the scan as the button of the page, then one row per device found
  // (docs/specs/mobile-pages/integration-devices.md)
  if (isMobile) {
    const all = discoveredDevices || [];
    const shown = filteredDevices || [];
    const loading = getDiscoveredDevicesStatus === RequestStatus.Getting;
    return (
      <MobileIntegrationTab dataCy="external-discover-mobile">
        <div class={integrationMobileStyle.block}>
          <BigButton variant="primary" icon="radio" onClick={scan} loading={scanning} data-cy="external-discover-scan">
            <Text
              id={
                scanning
                  ? 'integration.externalIntegration.discover.scanning'
                  : 'integration.externalIntegration.discover.scanButton'
              }
            />
          </BigButton>
        </div>
        {scanError && (
          <MobileNotice tone="danger" icon="alert-circle" role="alert" data-cy="external-discover-scan-error">
            <Text id={scanError} />
          </MobileNotice>
        )}
        {getDiscoveredDevicesStatus === RequestStatus.Error && (
          <MobileNotice tone="danger" icon="alert-circle" role="alert">
            <Text id="integration.externalIntegration.discover.loadError" />
          </MobileNotice>
        )}
        {scanning && (
          <MobileWaitingNotice data-cy="external-discover-scanning">
            <Text id="integration.externalIntegration.discover.scanningInProgress" />
          </MobileWaitingNotice>
        )}
        {all.length > 0 && (
          <MobileListToolbar
            onSearch={searchDevices}
            // the search is debounced: the field is not controlled, it only starts from the query
            // still applied to the list when it mounts again
            initialSearchValue={deviceSearch}
            searchPlaceholderId="integration.externalIntegration.discover.searchPlaceholder"
          />
        )}
        {/* as on the card, the list stays usable during the scan: only its own refresh covers it */}
        <MobileListLoader loading={loading} empty={all.length === 0}>
          {shown.length > 0 && (
            <div>
              <MobileSectionHeader
                title={<Text id="mobileDeviceList.foundCount" plural={shown.length} fields={{ count: shown.length }} />}
              />
              <MobileGroup>
                {shown.map(device => (
                  <DiscoveredBox key={device.external_id} isMobile device={device} createDevice={createDevice} />
                ))}
              </MobileGroup>
            </div>
          )}
          {discoveredDevices && all.length === 0 && !loading && (
            <MobileEmptyState icon="radio" text={<Text id="integration.externalIntegration.discover.noDevices" />}>
              {(get(integration, 'manifest.config_schema') || []).length > 0 && (
                <div class={kitStyle.footnote}>
                  <MarkupText
                    id="integration.externalIntegration.discover.noDevicesConfigureFirst"
                    fields={{ configUrl: `/dashboard/integration/device/external/${selector}/config` }}
                  />
                </div>
              )}
            </MobileEmptyState>
          )}
          {all.length > 0 && shown.length === 0 && (
            <MobileEmptyState
              icon="search"
              text={<Text id="integration.externalIntegration.discover.noSearchResults" />}
            />
          )}
        </MobileListLoader>
      </MobileIntegrationTab>
    );
  }
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
          <button class="btn btn-outline-primary btn-sm" onClick={scan} disabled={scanning}>
            <i class="fe fe-radio mr-1" />
            {scanning ? (
              <Text id="integration.externalIntegration.discover.scanning" />
            ) : (
              <Text id="integration.externalIntegration.discover.scanButton" />
            )}
          </button>
        </div>
      </div>
      <ul class="list-group list-group-flush">
        <li class="list-group-item">
          <label class="custom-switch">
            <input
              type="checkbox"
              class="custom-switch-input"
              checked={!!hideExistingDevices}
              onClick={toggleHideExistingDevices}
            />
            <span class="custom-switch-indicator mr-1" />
            <span class="custom-switch-description">
              <Text id="integration.externalIntegration.discover.hideExistingDevices" />
            </span>
          </label>
        </li>
      </ul>
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
        {scanning && (
          <div class={cx('alert alert-info', style.scanLoader)}>
            <div class="loader" />
            <Text id="integration.externalIntegration.discover.scanningInProgress" />
          </div>
        )}
        {/* the dimmer only covers the list refresh: during the scan itself
            the alert above is the progress signal and the list stays
            interactive, so already-discovered devices can still be added */}
        <div
          class={cx('dimmer', {
            active: getDiscoveredDevicesStatus === RequestStatus.Getting
          })}
        >
          <div class="loader" />
          <div class={cx('dimmer-content', style.discoverListBody)}>
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
            {discoveredDevices && discoveredDevices.length > 0 && visibleDevices.length === 0 && (
              <div class="text-center text-muted py-5">
                <Text id="integration.externalIntegration.discover.allDevicesHidden" />
              </div>
            )}
            {visibleDevices && visibleDevices.length > 0 && filteredDevices.length === 0 && (
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
