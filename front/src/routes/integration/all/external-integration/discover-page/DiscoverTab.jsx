import { Text, MarkupText, Localizer } from 'preact-i18n';
import cx from 'classnames';
import get from 'get-value';

import DiscoveredBox from './DiscoveredBox';
import style from './style.css';
import { RequestStatus } from '../../../../../utils/consts';
import withIntlAsProp from '../../../../../utils/withIntlAsProp';
import {
  MobileSectionHeader,
  MobileGroup,
  MobileRow,
  MobileSwitch,
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
// with a different structure): hiding it would hide the only way to apply it;
// one added or updated during this visit stays listed too, its "Already added"
// badge being the confirmation of the click, until the page is loaded again
const isHidden = (device, addedThisVisit) =>
  device.created && !device.structure_changed && !(addedThisVisit && addedThisVisit.has(device.external_id));

// the empty state of a list that shows nothing although devices were found.
// An active search answers first: it matches only hidden devices, or nothing
// at all; without one, everything is hidden by the toggle
const getEmptyListTextId = ({ discoveredDevices, filteredDevices, search, hiddenSearchMatch }) => {
  if (!discoveredDevices || discoveredDevices.length === 0 || filteredDevices.length > 0) {
    return null;
  }
  if (search) {
    return hiddenSearchMatch
      ? 'integration.externalIntegration.discover.searchMatchesHiddenDevices'
      : 'integration.externalIntegration.discover.noSearchResults';
  }
  return 'integration.externalIntegration.discover.allDevicesHidden';
};

const DiscoverTab = ({
  selector,
  integration,
  discoveredDevices,
  deviceSearch,
  searchDevices,
  hideExistingDevices,
  toggleHideExistingDevices,
  addedThisVisit,
  getDiscoveredDevicesStatus,
  scanStatus,
  scanError,
  scan,
  createDevice,
  isMobile,
  intl
}) => {
  const search = (deviceSearch || '').trim().toLowerCase();
  const visibleDevices =
    discoveredDevices && hideExistingDevices
      ? discoveredDevices.filter(device => !isHidden(device, addedThisVisit))
      : discoveredDevices;
  const filteredDevices =
    visibleDevices && search ? visibleDevices.filter(device => matchesSearch(device, search)) : visibleDevices;
  const hiddenSearchMatch =
    Boolean(search && hideExistingDevices && discoveredDevices) &&
    discoveredDevices.some(device => isHidden(device, addedThisVisit) && matchesSearch(device, search));
  const emptyListTextId = getEmptyListTextId({ discoveredDevices, filteredDevices, search, hiddenSearchMatch });
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
        <div class={integrationMobileStyle.block}>
          <MobileGroup>
            <MobileRow
              title={<Text id="integration.externalIntegration.discover.hideExistingDevices" />}
              trailing={
                <MobileSwitch
                  checked={!!hideExistingDevices}
                  onChange={toggleHideExistingDevices}
                  label={get(intl, 'dictionary.integration.externalIntegration.discover.hideExistingDevices')}
                  dataCy="external-discover-hide-existing"
                />
              }
            />
          </MobileGroup>
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
          {emptyListTextId && (
            <MobileEmptyState
              icon={emptyListTextId === 'integration.externalIntegration.discover.noSearchResults' ? 'search' : 'check'}
              text={<Text id={emptyListTextId} />}
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
            {emptyListTextId && (
              <div class="text-center text-muted py-5">
                <Text id={emptyListTextId} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default withIntlAsProp(DiscoverTab);
