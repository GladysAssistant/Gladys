import { Text, MarkupText } from 'preact-i18n';
import cx from 'classnames';
import get from 'get-value';

import EmptyState from './EmptyState';
import DiscoveredBox from './DiscoveredBox';
import CheckMqttPanel from '../commons/CheckMqttPanel';
import style from './style.css';
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
  MobileListLoader,
  MobileTextNotice,
  integrationMobileStyle
} from '../../../../../components/integration/mobile';

// The discovery on a phone (docs/specs/mobile-pages/integration-devices.md): the devices are
// pushed live, so "Refresh" is a quiet button, then one row per device found. Same props as the
// card below.
const MobileDiscoverTab = withIntlAsProp(({ intl, ...props }) => {
  const devices = props.mqttDiscoveredDevices || [];
  const loading = Boolean(props.mqttDiscoveryLoading);
  return (
    <MobileIntegrationTab dataCy="mqtt-discover-mobile">
      <CheckMqttPanel isMobile />
      <div class={cx(kitStyle.buttons, integrationMobileStyle.block)}>
        <BigButton
          icon="refresh-cw"
          onClick={props.getDiscoveredDevices}
          loading={loading}
          data-cy="mqtt-discover-refresh"
        >
          <Text id="integration.mqtt.discover.refreshButton" />
        </BigButton>
      </div>
      <div class={integrationMobileStyle.block}>
        <MobileGroup>
          <MobileRow
            title={<Text id="integration.mqtt.discover.hideExistingDevices" />}
            trailing={
              <MobileSwitch
                checked={props.mqttDiscoveryFilterExisting === undefined || props.mqttDiscoveryFilterExisting}
                onChange={props.toggleFilterOnExisting}
                disabled={loading}
                label={get(intl.dictionary, 'integration.mqtt.discover.hideExistingDevices')}
                dataCy="mqtt-discover-hide-existing"
              />
            }
          />
        </MobileGroup>
      </div>
      {props.mqttDiscoveryError && (
        <MobileNotice tone="danger" icon="alert-circle" role="alert">
          <Text id={props.mqttDiscoveryError} />
        </MobileNotice>
      )}
      <MobileListLoader loading={loading} empty={devices.length === 0}>
        {devices.length > 0 && (
          <div>
            <MobileSectionHeader
              title={
                <Text id="mobileDeviceList.foundCount" plural={devices.length} fields={{ count: devices.length }} />
              }
            />
            <MobileGroup>
              {devices.map(device => (
                <DiscoveredBox key={device.external_id} {...props} device={device} />
              ))}
            </MobileGroup>
          </div>
        )}
        {devices.length === 0 && !loading && (
          <MobileEmptyState icon="radio" text={<Text id="integration.mqtt.discover.noDeviceDiscovered" />} />
        )}
      </MobileListLoader>
      {devices.length > 0 && (
        <div class={integrationMobileStyle.afterList}>
          <MobileTextNotice icon="info">
            <MarkupText id="integration.mqtt.discover.description" />
          </MobileTextNotice>
        </div>
      )}
    </MobileIntegrationTab>
  );
});

const DiscoverTab = props => (
  <div class="card">
    <div class="card-header">
      <h1 class="card-title">
        <Text id="integration.mqtt.discover.title" />
      </h1>
      <div class="page-options d-flex">
        <button
          class="btn btn-outline-primary ml-2"
          onClick={props.getDiscoveredDevices}
          disabled={props.mqttDiscoveryLoading}
        >
          <Text id="integration.mqtt.discover.refreshButton" /> <i class="fe fe-refresh-cw" />
        </button>
      </div>
    </div>
    <ul class="list-group list-group-flush">
      <li class="list-group-item">
        <label class="custom-switch">
          <input
            type="checkbox"
            class="custom-switch-input"
            checked={props.mqttDiscoveryFilterExisting === undefined || props.mqttDiscoveryFilterExisting}
            onClick={props.toggleFilterOnExisting}
            disabled={props.mqttDiscoveryLoading}
          />
          <span class={cx('custom-switch-indicator', 'mr-1', { 'bg-light': props.mqttDiscoveryLoading })} />
          <span class="custom-switch-description">
            <Text id="integration.mqtt.discover.hideExistingDevices" />
          </span>
        </label>
      </li>
    </ul>
    <div class="card-body">
      <div class="alert alert-secondary">
        <MarkupText id="integration.mqtt.discover.description" />
      </div>
      <CheckMqttPanel />

      {props.mqttDiscoveryError && (
        <div class="alert alert-danger">
          <Text id={props.mqttDiscoveryError} />
        </div>
      )}

      <div
        class={cx('dimmer', {
          active: props.mqttDiscoveryLoading
        })}
      >
        <div class="loader" />
        <div class={cx('dimmer-content', style.mqttDiscoveryListBody)}>
          <div class="row">
            {props.mqttDiscoveredDevices &&
              props.mqttDiscoveredDevices.map(device => (
                <DiscoveredBox key={device.external_id} {...props} device={device} />
              ))}
            {(!props.mqttDiscoveredDevices || props.mqttDiscoveredDevices.length === 0) && <EmptyState />}
          </div>
        </div>
      </div>
    </div>
  </div>
);

const ResponsiveDiscoverTab = props => (props.isMobile ? <MobileDiscoverTab {...props} /> : <DiscoverTab {...props} />);

export default ResponsiveDiscoverTab;
