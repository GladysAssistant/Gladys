import { Text, MarkupText } from 'preact-i18n';
import cx from 'classnames';
import get from 'get-value';

import EmptyState from './EmptyState';
import DiscoveredBox from './DiscoveredBox';
import UnsupportedSection from './UnsupportedSection';
import { ZIGBEE2MQTT_SUPPORT, getSupport } from '../utils/support';
import style from './style.css';
import CheckStatus from '../commons/CheckStatus';
import {
  MobileSectionHeader,
  MobileGroup,
  MobileRow,
  MobileSwitch,
  MobileNotice,
  MobileEmptyState,
  BigButton
} from '../../../../../components/mobile';
import {
  MobileIntegrationTab,
  MobileListLoader,
  MobileTextNotice,
  integrationMobileStyle
} from '../../../../../components/integration/mobile';

const PAIR = 'integration.zigbee2mqtt.setup.dashboard.actions.pair';

// Pairing is the pairing window (docs/specs/zigbee2mqtt-pairing.md, D.1): not while Zigbee2mqtt does not answer, Gladys
// does not reach the broker, or it is not installed
const canPair = props => Boolean(props.zigbee2mqttConnected && props.gladysConnected) && props.z2mConfigured !== false;

// The devices Zigbee2mqtt supports in the list, the others in a section after it (docs/specs/zigbee2mqtt-pairing.md,
// E.5), each with its index in the list of the page, which the actions of its card use
const splitBySupport = devices => {
  const entries = (devices || []).map((device, index) => ({ device, index }));
  const isNative = entry => getSupport(entry.device) === ZIGBEE2MQTT_SUPPORT.NATIVE;
  return { native: entries.filter(isNative), unsupported: entries.filter(entry => !isNative(entry)) };
};

// The discovery on a phone (docs/specs/mobile-pages/integration-devices.md): the status of
// Zigbee2MQTT first, "Pair a device" as the button of the page, then one row per device of the network not in Gladys
// yet (pushed live). Same props as the card below.
const MobileDiscoverTab = props => {
  const { native, unsupported } = splitBySupport(props.zigbee2mqttDevices);
  const loading = Boolean(props.discoverZigbee2mqtt);
  return (
    <MobileIntegrationTab dataCy="z2m-discover-mobile">
      <CheckStatus isMobile />
      <div class={integrationMobileStyle.block}>
        <BigButton
          variant="primary"
          icon="radio"
          onClick={props.openPairing}
          disabled={!canPair(props)}
          data-cy="z2m-discover-pair"
        >
          <Text id={PAIR} />
        </BigButton>
      </div>
      <div class={integrationMobileStyle.block}>
        <MobileGroup>
          <MobileRow
            title={<Text id="integration.zigbee2mqtt.discover.hideExistingDevices" />}
            trailing={
              <MobileSwitch
                checked={props.filterExisting === undefined || props.filterExisting}
                onChange={props.toggleFilterOnExisting}
                disabled={loading}
                label={get(props.dictionary, 'integration.zigbee2mqtt.discover.hideExistingDevices')}
                dataCy="z2m-discover-hide-existing"
              />
            }
          />
        </MobileGroup>
      </div>
      {props.discoverZigbee2mqttError && (
        <MobileNotice tone="danger" icon="alert-circle" role="alert">
          <Text id={props.discoverZigbee2mqttError} />
        </MobileNotice>
      )}
      <MobileListLoader loading={loading} empty={native.length === 0 && unsupported.length === 0}>
        {native.length > 0 && (
          <div>
            <MobileSectionHeader
              title={<Text id="mobileDeviceList.foundCount" plural={native.length} fields={{ count: native.length }} />}
            />
            <MobileGroup>
              {native.map(({ device, index }) => (
                // all the props, as the card gets them: the save action reads the dictionary
                // from the props it is called on
                <DiscoveredBox key={device.external_id} {...props} isMobile device={device} deviceIndex={index} />
              ))}
            </MobileGroup>
          </div>
        )}
        {native.length === 0 && !loading && (
          <MobileEmptyState icon="radio" text={<Text id="integration.zigbee2mqtt.discover.noNewDevice" />} />
        )}
        {unsupported.length > 0 && <UnsupportedSection entries={unsupported} isMobile boxProps={props} />}
      </MobileListLoader>
      {/* The links to the Zigbee2MQTT interface are only in the sheets: what is missing for them
          comes after the devices, which are what one comes for. Not installed: the notice of
          CheckStatus is the only one */}
      {props.showZ2mUrlWarning && props.z2mConfigured !== false && (
        <div class={integrationMobileStyle.afterList}>
          <MobileTextNotice icon="info" data-cy="z2m-url-warning">
            <MarkupText id="integration.zigbee2mqtt.noZ2mUrlMessage" />
          </MobileTextNotice>
        </div>
      )}
    </MobileIntegrationTab>
  );
};

const DiscoverTab = ({ children, ...props }) => {
  const { native, unsupported } = splitBySupport(props.zigbee2mqttDevices);
  return (
    <div class="card">
      <div class="card-header">
        <h1 class="card-title">
          <Text id="integration.zigbee2mqtt.discover.title" />
        </h1>
        <div class="page-options d-flex">
          <button
            type="button"
            class="btn btn-primary"
            onClick={props.openPairing}
            disabled={!canPair(props)}
            data-cy="z2m-discover-pair"
          >
            <i class="fe fe-radio mr-2" aria-hidden="true" />
            <Text id={PAIR} />
          </button>
        </div>
      </div>
      <ul class="list-group list-group-flush">
        <li class="list-group-item">
          <label class="custom-switch">
            <input
              type="checkbox"
              class="custom-switch-input"
              checked={props.filterExisting === undefined || props.filterExisting}
              onClick={props.toggleFilterOnExisting}
              disabled={props.discoverZigbee2mqtt}
            />
            <span class={cx('custom-switch-indicator', 'mr-1', { 'bg-light': props.discoverZigbee2mqtt })} />
            <span class="custom-switch-description">
              <Text id="integration.zigbee2mqtt.discover.hideExistingDevices" />
            </span>
          </label>
        </li>
      </ul>
      <div class="card-body">
        {/* Not installed: the banner of CheckStatus is the only one */}
        {props.showZ2mUrlWarning && props.z2mConfigured !== false && (
          <div class="alert alert-info mb-4" data-cy="z2m-url-warning">
            <MarkupText id="integration.zigbee2mqtt.noZ2mUrlMessage" />
          </div>
        )}
        <CheckStatus />

        {props.discoverZigbee2mqttError && (
          <div class="alert alert-danger">
            <Text id={props.discoverZigbee2mqttError} />
          </div>
        )}

        <div
          class={cx('dimmer', {
            active: props.discoverZigbee2mqtt
          })}
        >
          <div class="loader" />
          <div class={cx('dimmer-content', style.zigbee2mqttListBody)}>
            <div class="row">
              {native.map(({ device, index }) => (
                <DiscoveredBox {...props} device={device} deviceIndex={index} />
              ))}
              {native.length === 0 && <EmptyState />}
            </div>
            {unsupported.length > 0 && <UnsupportedSection entries={unsupported} boxProps={props} />}
          </div>
        </div>
      </div>
    </div>
  );
};

const ResponsiveDiscoverTab = props => (props.isMobile ? <MobileDiscoverTab {...props} /> : <DiscoverTab {...props} />);

export default ResponsiveDiscoverTab;
