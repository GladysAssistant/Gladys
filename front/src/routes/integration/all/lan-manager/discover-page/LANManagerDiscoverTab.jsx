import { Text } from 'preact-i18n';
import cx from 'classnames';
import get from 'get-value';

import { RequestStatus } from '../../../../../utils/consts';
import LANManagerDiscoverDevice from './LANManagerDiscoverDevice';
import EmptyState from '../EmptyState';
import style from '../style.css';
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
  MobileListLoader,
  MobileWaitingNotice,
  integrationMobileStyle
} from '../../../../../components/integration/mobile';
import withIntlAsProp from '../../../../../utils/withIntlAsProp';

// The discovery on a phone (docs/specs/mobile-pages/integration-devices.md): the scan as the
// button of the page — it says "Stop the scan" while one runs, the card only turns red — then
// one row per device found. Same props as the card below.
const MobileLANManagerDiscoverTab = withIntlAsProp(
  ({
    lanManagerGetDiscoveredDevicesStatus,
    lanManagerDiscoveredDevices = [],
    lanManagerDiscoverUpdate = true,
    lanManagerStatus = {},
    filterExisting = true,
    getDiscoveredDevices,
    scan,
    intl,
    ...props
  }) => {
    const { scanning } = lanManagerStatus;
    const displayLoader = Boolean(scanning) && lanManagerDiscoveredDevices.length === 0;
    return (
      <MobileIntegrationTab dataCy="lan-manager-discover-mobile">
        <div class={cx(kitStyle.buttons, integrationMobileStyle.block)}>
          <BigButton
            variant={scanning ? 'dangerSoft' : 'primary'}
            icon={scanning ? 'square' : 'radio'}
            onClick={scan}
            data-cy="lan-manager-discover-scan"
          >
            <Text id={scanning ? 'mobileDeviceList.stopScan' : 'integration.lanManager.discover.scanButton'} />
          </BigButton>
          {lanManagerDiscoverUpdate && (
            <BigButton icon="refresh-cw" onClick={getDiscoveredDevices} data-cy="lan-manager-discover-update">
              <Text id="integration.lanManager.discover.deviceUpdateButton" />
            </BigButton>
          )}
        </div>
        <div class={integrationMobileStyle.block}>
          <MobileGroup>
            <MobileRow
              title={<Text id="integration.lanManager.discover.hideExistingDevices" />}
              trailing={
                <MobileSwitch
                  checked={filterExisting}
                  onChange={props.toggleFilterOnExisting}
                  disabled={Boolean(scanning)}
                  label={get(intl.dictionary, 'integration.lanManager.discover.hideExistingDevices')}
                  dataCy="lan-manager-discover-hide-existing"
                />
              }
            />
          </MobileGroup>
        </div>
        {scanning && lanManagerDiscoveredDevices.length > 0 && (
          <MobileWaitingNotice data-cy="lan-manager-discover-scanning">
            <Text id="mobileDeviceList.scanning" />
          </MobileWaitingNotice>
        )}
        {lanManagerGetDiscoveredDevicesStatus === RequestStatus.Error && (
          <MobileNotice tone="danger" icon="alert-circle" role="alert">
            <Text id="integration.lanManager.discover.discoveringError" />
          </MobileNotice>
        )}
        <MobileListLoader loading={displayLoader} empty>
          {lanManagerDiscoveredDevices.length > 0 && (
            <div>
              <MobileSectionHeader
                title={
                  <Text
                    id="mobileDeviceList.foundCount"
                    plural={lanManagerDiscoveredDevices.length}
                    fields={{ count: lanManagerDiscoveredDevices.length }}
                  />
                }
              />
              <MobileGroup>
                {lanManagerDiscoveredDevices.map((lanManagerDevice, index) => (
                  <LANManagerDiscoverDevice
                    key={lanManagerDevice.external_id}
                    isMobile
                    device={lanManagerDevice}
                    deviceIndex={index}
                    houses={props.houses}
                    updateDeviceProperty={props.updateDeviceProperty}
                    saveDevice={props.saveDevice}
                  />
                ))}
              </MobileGroup>
            </div>
          )}
          {lanManagerDiscoveredDevices.length === 0 && !displayLoader && (
            <MobileEmptyState icon="wifi" text={<Text id="integration.lanManager.discover.noDevices" />} />
          )}
        </MobileListLoader>
      </MobileIntegrationTab>
    );
  }
);

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

const ResponsiveLANManagerDiscoverTab = props =>
  props.isMobile ? <MobileLANManagerDiscoverTab {...props} /> : <LANManagerDiscoverTab {...props} />;

export default ResponsiveLANManagerDiscoverTab;
