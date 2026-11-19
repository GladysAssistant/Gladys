import { Component } from 'preact';
import { Text, MarkupText } from 'preact-i18n';
import cx from 'classnames';
import get from 'get-value';

import EmptyState from './EmptyState';
import DiscoveredBox from './DiscoveredBox';
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
  MobileWaitingNotice,
  MobileTextNotice,
  integrationMobileStyle
} from '../../../../../components/integration/mobile';

/**
 * @description Permit joining as the button of the page on a phone
 * (docs/specs/mobile-pages/integration-devices.md, E): the request of the desktop switch, which
 * toggles — so the button waits for its answer, a second tap would close what the first one
 * opened. While joining is open it says so, and the button closes it.
 */
class MobilePermitJoin extends Component {
  state = {
    busy: false,
    // the sentence of the last toggle that failed, until the next one
    failedKey: null
  };

  componentDidUpdate(prevProps) {
    // a newer state of the joining, pushed live, makes the last failure outdated
    if (prevProps.permitJoin !== this.props.permitJoin && this.state.failedKey) {
      this.setState({ failedKey: null });
    }
  }

  componentWillUnmount() {
    this.unmounted = true;
  }

  isOpen = () => Boolean(this.props.permitJoin) && !this.props.disabled;

  toggle = async () => {
    if (this.state.busy) {
      return;
    }
    const failedKey = this.isOpen()
      ? 'integration.zigbee2mqtt.discover.stopPermitJoinError'
      : 'integration.zigbee2mqtt.discover.permitJoinError';
    this.setState({ busy: true, failedKey: null });
    let failed = false;
    try {
      // the state of the joining comes back live (PERMIT_JOIN), as for the switch
      await this.props.togglePermitJoin();
    } catch (e) {
      console.error(e);
      failed = true;
    }
    if (!this.unmounted) {
      this.setState({ busy: false, failedKey: failed ? failedKey : null });
    }
  };

  render({ disabled }, { busy, failedKey }) {
    const open = this.isOpen();
    return (
      <div>
        <div class={integrationMobileStyle.block}>
          <BigButton
            variant={open ? 'dangerSoft' : 'primary'}
            icon={open ? 'square' : 'radio'}
            onClick={this.toggle}
            loading={busy}
            disabled={disabled}
            data-cy="z2m-discover-permit-join"
          >
            <Text
              id={
                open ? 'integration.zigbee2mqtt.discover.stopPermitJoin' : 'integration.zigbee2mqtt.discover.permitJoin'
              }
            />
          </BigButton>
        </div>
        {open && (
          <MobileWaitingNotice data-cy="z2m-discover-permit-join-open">
            <Text id="integration.zigbee2mqtt.discover.permitJoinOpen" />
          </MobileWaitingNotice>
        )}
        {failedKey && (
          <MobileNotice tone="danger" icon="alert-circle" role="alert" data-cy="z2m-discover-permit-join-error">
            <Text id={failedKey} />
          </MobileNotice>
        )}
      </div>
    );
  }
}

// The discovery on a phone (docs/specs/mobile-pages/integration-devices.md): the status of
// Zigbee2MQTT first, permitting joining as the button of the page, then one row per device found
// (pushed live). Same props as the card below.
const MobileDiscoverTab = props => {
  const devices = props.zigbee2mqttDevices || [];
  const loading = Boolean(props.discoverZigbee2mqtt);
  return (
    <MobileIntegrationTab dataCy="z2m-discover-mobile">
      <CheckStatus isMobile />
      <MobilePermitJoin
        permitJoin={props.permitJoin}
        togglePermitJoin={props.togglePermitJoin}
        // the conditions of the desktop switch
        disabled={!props.zigbee2mqttConnected || !props.gladysConnected || props.z2mConfigured === false}
      />
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
      <MobileListLoader loading={loading} empty={devices.length === 0}>
        {devices.length > 0 && (
          <div>
            <MobileSectionHeader
              title={
                <Text id="mobileDeviceList.foundCount" plural={devices.length} fields={{ count: devices.length }} />
              }
            />
            <MobileGroup>
              {devices.map((device, index) => (
                // all the props, as the card gets them: the save action reads the dictionary
                // from the props it is called on
                <DiscoveredBox key={device.external_id} {...props} isMobile device={device} deviceIndex={index} />
              ))}
            </MobileGroup>
          </div>
        )}
        {devices.length === 0 && !loading && (
          <MobileEmptyState icon="radio" text={<Text id="integration.zigbee2mqtt.discover.noNewDevice" />} />
        )}
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

const DiscoverTab = ({ children, ...props }) => (
  <div class="card">
    <div class="card-header">
      <h1 class="card-title">
        <Text id="integration.zigbee2mqtt.discover.title" />
      </h1>
      <div class="page-options d-flex">
        <label class="custom-switch">
          <input
            type="checkbox"
            id="permitJoin"
            name="permitJoin"
            class="custom-switch-input"
            checked={props.permitJoin}
            onClick={props.togglePermitJoin}
            disabled={!props.zigbee2mqttConnected || !props.gladysConnected || props.z2mConfigured === false}
          />
          <span class="custom-switch-indicator" />
          <span class="custom-switch-description">
            <Text id="integration.zigbee2mqtt.discover.permitJoin" />
          </span>
        </label>
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
            {props.zigbee2mqttDevices &&
              props.zigbee2mqttDevices.map((device, index) => (
                <DiscoveredBox {...props} device={device} deviceIndex={index} />
              ))}
            {(!props.zigbee2mqttDevices || props.zigbee2mqttDevices.length === 0) && <EmptyState />}
          </div>
        </div>
      </div>
    </div>
  </div>
);

const ResponsiveDiscoverTab = props => (props.isMobile ? <MobileDiscoverTab {...props} /> : <DiscoverTab {...props} />);

export default ResponsiveDiscoverTab;
