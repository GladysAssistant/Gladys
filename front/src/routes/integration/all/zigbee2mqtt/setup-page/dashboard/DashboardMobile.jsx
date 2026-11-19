import { Component } from 'preact';
import { Text, MarkupText } from 'preact-i18n';
import cx from 'classnames';
import get from 'get-value';

import {
  MobileSectionHeader,
  MobileGroup,
  MobileRow,
  MobileNotice,
  BigButton,
  ConfirmSheet,
  kitStyle
} from '../../../../../../components/mobile';
import { MobileIntegrationTab, MobileProgress } from '../../../../../../components/integration/mobile';
import withIntlAsProp from '../../../../../../utils/withIntlAsProp';
import { RequestStatus } from '../../../../../../utils/consts';
import MqttConnectionError from '../../commons/MqttConnectionError';
import { formatDuration } from '../wizard/format';
import InstallFailure from '../wizard/InstallFailure';
import KeyPhoto from '../wizard/KeyPhoto';
import { DASHBOARD_STATE, getStartupError, getStopKeys, isExternal, isNetworkCoordinator } from './dashboardState';
import { getDriver } from './KeyCard';
import {
  DISCOVER_URL,
  SERVICES_URL,
  ICONS,
  PRIMARY_ICONS,
  Subtitle,
  Title,
  getInstallationPhase,
  getPrimaryLabel
} from './StatusCard';
import style from './dashboard.css';

const T = 'integration.zigbee2mqtt.setup.dashboard';

// Not listed: neutral (installing, starting, stopped, stopping, inactive)
const TONES = {
  [DASHBOARD_STATE.ONLINE]: 'success',
  [DASHBOARD_STATE.DONGLE_MISSING]: 'warning',
  [DASHBOARD_STATE.FAILED]: 'danger',
  [DASHBOARD_STATE.MQTT_ERROR]: 'danger',
  [DASHBOARD_STATE.NOT_ANSWERING]: 'warning'
};

const WORKING = [DASHBOARD_STATE.INSTALLING, DASHBOARD_STATE.STARTING, DASHBOARD_STATE.STOPPING];

const StateTile = ({ state }) => (
  <span class={cx(kitStyle.rowTile, kitStyle[`rowTile-${TONES[state] || 'neutral'}`])} aria-hidden="true">
    <i class={cx(`fe fe-${ICONS[state]}`, { [style.spin]: WORKING.includes(state) })} />
  </span>
);

const Fact = ({ name, value }) => (
  <MobileRow
    title={<Text id={`${T}.facts.${name}`} />}
    value={value || <Text id={`${T}.facts.unknown`} />}
    dataCy={`z2m-dashboard-fact-${name}`}
  />
);

// The coordinator (or the broker of an external Zigbee2mqtt), what it runs, and the way to change it
const Coordinator = ({ view, actions }) => {
  const { configuration, status, savedAdapter } = view;
  if (isExternal(configuration)) {
    return (
      <MobileGroup data-cy="z2m-dashboard-key">
        <MobileRow icon="share-2" title={<Text id={`${T}.external.title`} />} subtitle={configuration.mqttUrl} />
        <Fact name="version" value={status.z2mVersion} />
        <Fact name="devices" value={Number.isInteger(status.deviceCount) ? `${status.deviceCount}` : null} />
      </MobileGroup>
    );
  }
  const network = isNetworkCoordinator(configuration);
  const driver = getDriver(configuration, savedAdapter);
  const revision = get(status, 'coordinatorFirmware.revision');
  return (
    <MobileGroup data-cy="z2m-dashboard-key">
      <MobileRow
        icon={network ? 'wifi' : null}
        tile={!network && <KeyPhoto adapter={savedAdapter} size={44} />}
        title={
          <span data-cy="z2m-dashboard-key-name">
            {network ? (
              <Text id={`${T}.network.title`} />
            ) : (
              (savedAdapter && savedAdapter.displayName) || configuration.z2mDongleName
            )}
          </span>
        }
        subtitle={network ? configuration.z2mNetworkAdapterUrl : savedAdapter && savedAdapter.modelCode}
      />
      <Fact
        name="driver"
        value={driver === 'ezsp' ? <Text id="integration.zigbee2mqtt.setup.wizard.ready.ezspDriver" /> : driver}
      />
      <Fact name="firmware" value={revision !== undefined && revision !== null ? `${revision}` : null} />
      <Fact name="version" value={status.z2mVersion} />
      <MobileRow
        icon="repeat"
        title={<Text id={`${T}.mobile.changeKey`} />}
        onClick={actions.changeKey}
        disabled={view.installing}
        dataCy="z2m-dashboard-change-key"
      />
    </MobileGroup>
  );
};

/**
 * @description The dashboard on a phone (docs/specs/zigbee2mqtt-installation.md, N.5): the state and its action, the
 * coordinator, then restart, stop and the interface as rows, each confirmed when it interrupts the network. Same view
 * and actions as the large screen layout.
 */
class DashboardMobile extends Component {
  askRestart = () => this.setState({ confirmRestart: true });

  cancelRestart = () => this.setState({ confirmRestart: false });

  restart = () => {
    this.setState({ confirmRestart: false });
    this.props.actions.restart();
  };

  render({ view, actions, intl }, { confirmRestart }) {
    const { state, status, primaryAction, actionStatus, newDeviceCount, tiles, z2mUrl } = view;
    const startupError = state === DASHBOARD_STATE.FAILED ? getStartupError(status) : null;
    const busy = actionStatus === RequestStatus.Getting;
    const dictionary = get(intl, 'dictionary');
    const stopKeys = getStopKeys(view.configuration);
    return (
      <MobileIntegrationTab dataCy="z2m-dashboard">
        <MobileGroup data-cy="z2m-dashboard-status" data-state={state}>
          <MobileRow
            tile={<StateTile state={state} />}
            title={
              <span role="status" data-cy="z2m-dashboard-title">
                <Title view={view} />
              </span>
            }
            subtitle={
              <span data-cy="z2m-dashboard-subtitle">
                <Subtitle view={view} />
              </span>
            }
          />
          {state === DASHBOARD_STATE.ONLINE && newDeviceCount > 0 && (
            <MobileRow
              icon="plus-circle"
              iconTone="success"
              title={<Text id={`${T}.newDevices`} plural={newDeviceCount} fields={{ count: newDeviceCount }} />}
              href={DISCOVER_URL}
              dataCy="z2m-dashboard-new-devices"
            />
          )}
        </MobileGroup>

        {state === DASHBOARD_STATE.INSTALLING && (
          <div class={style.mobileProgress} data-cy="z2m-dashboard-progress">
            <MobileProgress value={status.installation.progress} label={`${status.installation.progress} %`} />
            <div class={style.progressLine}>
              <span data-cy="z2m-dashboard-phase">
                <Text id={getInstallationPhase(view).detail || getInstallationPhase(view).label} />
              </span>
              <span class={style.progressValue}>{status.installation.progress} %</span>
            </div>
          </div>
        )}
        {startupError && (
          <MobileNotice tone="danger" icon="alert-triangle" role="alert" data-cy="z2m-dashboard-error">
            <InstallFailure error={startupError} />
          </MobileNotice>
        )}
        {state === DASHBOARD_STATE.MQTT_ERROR && (
          <MobileNotice tone="danger" icon="alert-triangle" role="alert" data-cy="z2m-dashboard-mqtt-error">
            <MqttConnectionError error={status.mqttConnectionError} />
          </MobileNotice>
        )}
        {view.installationSucceeded && (
          <MobileNotice tone="success" icon="check" data-cy="z2m-dashboard-installation-success">
            <Text
              id={`integration.zigbee2mqtt.setup.installation.success.${status.installation.kind}`}
              fields={{ duration: formatDuration(status.installation.durationMs) }}
            />
          </MobileNotice>
        )}
        {view.permitJoinAllowed && state === DASHBOARD_STATE.ONLINE && (
          <MobileNotice tone="success" icon="radio" role="status" data-cy="z2m-dashboard-permit-join-allowed">
            <MarkupText id={`${T}.pairAllowed`} />
          </MobileNotice>
        )}
        {status.updatePending && state !== DASHBOARD_STATE.INSTALLING && (
          <MobileNotice icon="download-cloud" data-cy="z2m-dashboard-update-pending">
            <Text id={`${T}.updatePending`} />
          </MobileNotice>
        )}
        {view.ezspDriver && (
          <MobileNotice data-cy="z2m-dashboard-ezsp">
            <MarkupText id="integration.zigbee2mqtt.setup.wizard.ready.ezspNote" />
          </MobileNotice>
        )}
        {view.actionError && (
          <MobileNotice tone="warning" icon="alert-circle" role="alert" data-cy="z2m-dashboard-action-error">
            <Text id={`${T}.actionErrors.${view.actionError}`} />
          </MobileNotice>
        )}

        {(primaryAction ||
          (view.canChangeKey && state === DASHBOARD_STATE.FAILED) ||
          state === DASHBOARD_STATE.INACTIVE) && (
          <div class={kitStyle.buttons}>
            {primaryAction && (
              <BigButton
                variant="primary"
                icon={PRIMARY_ICONS[primaryAction]}
                loading={busy}
                onClick={actions[primaryAction]}
                data-cy={`z2m-dashboard-${primaryAction}`}
              >
                <Text id={getPrimaryLabel(primaryAction, view.configuration)} />
              </BigButton>
            )}
            {state === DASHBOARD_STATE.INACTIVE && (
              <BigButton href={SERVICES_URL} data-cy="z2m-dashboard-services">
                <Text id={`${T}.actions.services`} />
              </BigButton>
            )}
            {view.canChangeKey && state === DASHBOARD_STATE.FAILED && (
              <BigButton onClick={actions.changeKey} data-cy="z2m-dashboard-failure-change-key">
                <Text id="integration.zigbee2mqtt.setup.wizard.failure.changeKey" />
              </BigButton>
            )}
          </div>
        )}

        <MobileSectionHeader
          title={<Text id={isExternal(view.configuration) ? `${T}.external.title` : `${T}.mobile.keyTitle`} />}
        />
        <Coordinator view={view} actions={actions} />

        {tiles.length > 0 && (
          <MobileGroup class={style.mobileSpaced} data-cy="z2m-dashboard-tiles">
            {tiles.includes('restart') && (
              <MobileRow
                icon="refresh-cw"
                title={<Text id={`${T}.actions.restart`} />}
                onClick={this.askRestart}
                disabled={busy}
                dataCy="z2m-dashboard-restart"
              />
            )}
            {tiles.includes('stop') && (
              <MobileRow
                icon="square"
                iconTone="danger"
                tone="danger"
                title={<Text id={`${T}.${stopKeys.label}`} />}
                onClick={actions.askStop}
                disabled={busy}
                dataCy="z2m-dashboard-stop"
              />
            )}
            {tiles.includes('interface') && (
              <a
                href={z2mUrl}
                target="_blank"
                rel="noopener noreferrer"
                class={kitStyle.row}
                data-cy="z2m-dashboard-interface"
              >
                <span class={cx(kitStyle.rowTile, kitStyle['rowTile-neutral'])} aria-hidden="true">
                  <i class="fe fe-monitor" />
                </span>
                <span class={kitStyle.rowText}>
                  <span class={kitStyle.rowTitle}>
                    <Text id={`${T}.actions.interface`} />
                  </span>
                </span>
                <i class={cx('fe', 'fe-external-link', kitStyle.rowChevron)} aria-hidden="true" />
              </a>
            )}
          </MobileGroup>
        )}

        <MobileGroup class={style.mobileSpaced}>
          <MobileRow
            icon="sliders"
            title={<Text id={`${T}.advanced.title`} />}
            onClick={actions.showAdvanced}
            dataCy="z2m-dashboard-advanced-link"
          />
        </MobileGroup>

        <ConfirmSheet
          open={view.confirmStop}
          title={get(dictionary, `${T}.${stopKeys.confirm}.title`)}
          text={<Text id={`${T}.${stopKeys.confirm}.text`} />}
          confirmLabel={<Text id={`${T}.${stopKeys.confirm}.confirm`} />}
          destructive
          loading={busy}
          onConfirm={actions.stop}
          onCancel={actions.cancelStop}
          dataCy="z2m-dashboard-confirm-stop"
        />
        <ConfirmSheet
          open={Boolean(confirmRestart)}
          title={get(dictionary, `${T}.confirmRestart.title`)}
          text={<Text id={`${T}.confirmRestart.text`} />}
          confirmLabel={<Text id={`${T}.actions.restart`} />}
          onConfirm={this.restart}
          onCancel={this.cancelRestart}
          dataCy="z2m-dashboard-confirm-restart"
        />
      </MobileIntegrationTab>
    );
  }
}

export default withIntlAsProp(DashboardMobile);
