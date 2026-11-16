import { Text, Localizer, MarkupText } from 'preact-i18n';
import cx from 'classnames';
import get from 'get-value';

import DeviceBox from './DeviceBox';
import TransportBadge from '../components/TransportBadge';
import { getDeviceTransport, isDeviceTransportDegraded } from '../utils';
import { RequestStatus } from '../../../../../utils/consts';
import {
  MobileSectionHeader,
  MobileGroup,
  MobileNotice,
  MobilePill,
  MobileEmptyState,
  kitStyle
} from '../../../../../components/mobile';
import {
  MobileIntegrationTab,
  MobileListLoader,
  integrationMobileStyle
} from '../../../../../components/integration/mobile';

const TRANSPORT_TONES = {
  local: 'success',
  cloud: 'accent',
  unreachable: 'danger'
};

// global summary of the per-device transports ("12 local · 3 cloud ·
// 1 unreachable · 1 degraded"), only counting devices that report one
const getTransportCounts = devices => {
  const counts = {};
  (devices || []).forEach(device => {
    const transport = getDeviceTransport(device);
    if (transport) {
      counts[transport] = (counts[transport] || 0) + 1;
    }
  });
  return counts;
};

const DeviceTab = ({
  selector,
  integration,
  devices,
  houses,
  language,
  getDevicesStatus,
  getDevices,
  updateDeviceField,
  updateFeatureProperty,
  saveDevice,
  deleteDevice,
  isMobile
}) => {
  // first-run guidance: an integration with settings probably needs them
  // filled before anything shows up here
  const hasConfigSchema = (get(integration, 'manifest.config_schema') || []).length > 0;
  const transportCounts = getTransportCounts(devices);
  const reportedTransports = ['local', 'cloud', 'unreachable'].filter(transport => transportCounts[transport]);
  const degradedCount = (devices || []).filter(isDeviceTransportDegraded).length;
  // On a phone: one row per device opening its sheet
  // (docs/specs/mobile-pages/integration-devices.md)
  if (isMobile) {
    const list = devices || [];
    const loading = getDevicesStatus === RequestStatus.Getting;
    return (
      <MobileIntegrationTab dataCy="external-devices-mobile">
        {getDevicesStatus === RequestStatus.Error && (
          <MobileNotice tone="danger" icon="alert-circle" role="alert">
            <Text id="integration.externalIntegration.device.loadError" />
          </MobileNotice>
        )}
        <MobileSectionHeader
          title={<Text id="mobileDeviceList.deviceCount" plural={list.length} fields={{ count: list.length }} />}
          action={
            <button
              type="button"
              class={kitStyle.sectionAction}
              onClick={getDevices}
              data-cy="external-devices-refresh"
            >
              <Text id="integration.externalIntegration.device.refreshButton" />
            </button>
          }
        />
        {(reportedTransports.length > 0 || degradedCount > 0) && (
          <div class={integrationMobileStyle.sheetPills} data-cy="external-devices-transports">
            {reportedTransports.map(transport => (
              <MobilePill tone={TRANSPORT_TONES[transport]}>
                {transportCounts[transport]} <Text id={`integration.externalIntegration.transport.${transport}Badge`} />
              </MobilePill>
            ))}
            {degradedCount > 0 && (
              <MobilePill tone="warning">
                {degradedCount} <Text id="integration.externalIntegration.transport.degradedBadge" />
              </MobilePill>
            )}
          </div>
        )}
        <MobileListLoader loading={loading} empty={list.length === 0}>
          {list.length > 0 && (
            <MobileGroup>
              {list.map((device, index) => (
                <DeviceBox
                  key={device.id || device.external_id}
                  isMobile
                  device={device}
                  deviceIndex={index}
                  houses={houses}
                  language={language}
                  updateDeviceField={updateDeviceField}
                  updateFeatureProperty={updateFeatureProperty}
                  saveDevice={saveDevice}
                  deleteDevice={deleteDevice}
                />
              ))}
            </MobileGroup>
          )}
          {devices && list.length === 0 && !loading && (
            <MobileEmptyState icon="box" text={<Text id="integration.externalIntegration.device.noDevices" />}>
              {hasConfigSchema && (
                <div class={kitStyle.footnote}>
                  <MarkupText
                    id="integration.externalIntegration.device.noDevicesConfigureFirst"
                    fields={{ configUrl: `/dashboard/integration/device/external/${selector}/config` }}
                  />
                </div>
              )}
            </MobileEmptyState>
          )}
        </MobileListLoader>
      </MobileIntegrationTab>
    );
  }
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
        {(reportedTransports.length > 0 || degradedCount > 0) && (
          <div class="mb-4">
            {reportedTransports.map(transport => (
              <span class="mr-3">
                {transportCounts[transport]} <TransportBadge transport={transport} />
              </span>
            ))}
            {degradedCount > 0 && (
              <span class="mr-3">
                {degradedCount}{' '}
                <Localizer>
                  <span
                    class="badge badge-warning"
                    title={<Text id="integration.externalIntegration.transport.degradedTooltip" />}
                  >
                    <Text id="integration.externalIntegration.transport.degradedBadge" />
                  </span>
                </Localizer>
              </span>
            )}
          </div>
        )}
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
                    updateFeatureProperty={updateFeatureProperty}
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
