import { Text, MarkupText } from 'preact-i18n';
import { Link } from 'preact-router/match';
import cx from 'classnames';

import { RequestStatus } from '../../../../../../utils/consts';
import MqttConnectionError from '../../commons/MqttConnectionError';
import { formatDuration } from '../wizard/format';
import { getPhases, getCurrentPhase } from '../wizard/phases';
import InstallFailure from '../wizard/InstallFailure';
import { isTooOld } from '../wizard/WaitingText';
import { DASHBOARD_STATE, getBrokerError, getStartupError, isExternal, isNetworkCoordinator } from './dashboardState';
import style from './dashboard.css';

const T = 'integration.zigbee2mqtt.setup.dashboard';
export const DISCOVER_URL = '/dashboard/integration/device/zigbee2mqtt/discover';

export const ICONS = {
  [DASHBOARD_STATE.ONLINE]: 'radio',
  [DASHBOARD_STATE.INSTALLING]: 'loader',
  [DASHBOARD_STATE.STARTING]: 'loader',
  [DASHBOARD_STATE.STOPPED]: 'square',
  [DASHBOARD_STATE.STOPPING]: 'loader',
  [DASHBOARD_STATE.DONGLE_MISSING]: 'cpu',
  [DASHBOARD_STATE.FAILED]: 'alert-triangle',
  [DASHBOARD_STATE.INACTIVE]: 'power',
  [DASHBOARD_STATE.PENDING]: 'loader',
  [DASHBOARD_STATE.MQTT_ERROR]: 'alert-triangle',
  [DASHBOARD_STATE.NOT_ANSWERING]: 'alert-circle'
};

// The states shown with a spinner
const WORKING_STATES = [
  DASHBOARD_STATE.INSTALLING,
  DASHBOARD_STATE.STARTING,
  DASHBOARD_STATE.STOPPING,
  DASHBOARD_STATE.PENDING
];

const TONES = {
  [DASHBOARD_STATE.ONLINE]: style.toneGreen,
  [DASHBOARD_STATE.INSTALLING]: style.toneBlue,
  [DASHBOARD_STATE.STARTING]: style.toneBlue,
  [DASHBOARD_STATE.STOPPED]: style.toneGrey,
  [DASHBOARD_STATE.STOPPING]: style.toneGrey,
  [DASHBOARD_STATE.DONGLE_MISSING]: style.toneAmber,
  [DASHBOARD_STATE.FAILED]: style.toneRed,
  [DASHBOARD_STATE.INACTIVE]: style.toneGrey,
  [DASHBOARD_STATE.PENDING]: style.toneBlue,
  [DASHBOARD_STATE.MQTT_ERROR]: style.toneRed,
  [DASHBOARD_STATE.NOT_ANSWERING]: style.toneAmber
};

// "17 nov. 2026, 08:00", in the language of the user
const formatDate = (isoDate, language) => {
  try {
    return new Date(isoDate).toLocaleString(language, { dateStyle: 'medium', timeStyle: 'short' });
  } catch (e) {
    return isoDate;
  }
};

export const Title = ({ view }) => {
  const { state, status, configuration } = view;
  if (state === DASHBOARD_STATE.INSTALLING) {
    return <Text id={`integration.zigbee2mqtt.setup.installation.titles.${status.installation.kind}`} />;
  }
  if (state === DASHBOARD_STATE.ONLINE && isExternal(configuration)) {
    return <Text id={`${T}.states.onlineExternal.title`} />;
  }
  // Gladys reaches the broker, Zigbee2mqtt does not answer on it (as the wizard waits for it)
  if (state === DASHBOARD_STATE.NOT_ANSWERING && isExternal(configuration)) {
    return <Text id={`${T}.states.notAnsweringExternal.title`} />;
  }
  // With an external broker, a stop only disconnects Gladys: Zigbee2mqtt runs on
  if (state === DASHBOARD_STATE.STOPPED && isExternal(configuration)) {
    return <Text id={`${T}.states.stoppedExternal.title`} />;
  }
  return <Text id={`${T}.states.${state}.title`} />;
};

export const Subtitle = ({ view }) => {
  const { state, status, language, configuration } = view;
  if (state === DASHBOARD_STATE.ONLINE) {
    return Number.isInteger(status.deviceCount) ? (
      <Text id={`${T}.states.online.devices`} plural={status.deviceCount} fields={{ count: status.deviceCount }} />
    ) : null;
  }
  if (state === DASHBOARD_STATE.STOPPED) {
    const stopped = isExternal(configuration) ? 'stoppedExternal' : 'stopped';
    return <Text id={`${T}.states.${stopped}.since`} fields={{ date: formatDate(status.stoppedAt, language) }} />;
  }
  if (state === DASHBOARD_STATE.INSTALLING) {
    return <Text id="integration.zigbee2mqtt.setup.installation.leavePage" />;
  }
  if (state === DASHBOARD_STATE.NOT_ANSWERING && isExternal(configuration)) {
    return <MarkupText id={`${T}.states.notAnsweringExternal.text`} />;
  }
  return <Text id={`${T}.states.${state}.text`} />;
};

// The phase of an installation run from the dashboard (a start, a change of dongle, an update)
export const getInstallationPhase = ({ status, configuration }) =>
  getCurrentPhase(
    getPhases(status.installation, {
      configuration,
      external: isExternal(configuration),
      ezspFallback: Boolean(status.ezspFallback)
    })
  );

// An external Zigbee2mqtt that does not answer because it is older than the health check (the version comes from the
// broker: a text, never markup)
export const TooOldNotice = ({ view }) =>
  view.state === DASHBOARD_STATE.NOT_ANSWERING && isExternal(view.configuration) && isTooOld(view.status.z2mVersion) ? (
    <span>
      <strong>
        <Text
          id="integration.zigbee2mqtt.setup.wizard.progress.zigbee2mqttTooOldTitle"
          fields={{ version: view.status.z2mVersion }}
        />
      </strong>{' '}
      <Text id="integration.zigbee2mqtt.setup.wizard.progress.zigbee2mqttTooOld" />
    </span>
  ) : null;

// The progress of an installation run from the dashboard
const Progress = ({ view }) => {
  const { installation } = view.status;
  const phase = getInstallationPhase(view);
  return (
    <div class={style.progress} data-cy="z2m-dashboard-progress">
      <div class={cx('progress', style.progressBar)}>
        <div
          class="progress-bar bg-primary"
          style={{ width: `${installation.progress}%` }}
          role="progressbar"
          aria-valuenow={installation.progress}
          aria-valuemin="0"
          aria-valuemax="100"
        />
      </div>
      <div class={style.progressLine}>
        <span data-cy="z2m-dashboard-phase">
          <Text id={phase.detail || phase.label} />
        </span>
        <span class={style.progressValue}>{installation.progress} %</span>
      </div>
    </div>
  );
};

export const PRIMARY_LABELS = {
  pair: `${T}.actions.pair`,
  start: `${T}.actions.start`,
  restart: `${T}.actions.restart`,
  editConnection: 'integration.zigbee2mqtt.setup.wizard.failure.changeConnection'
};

export const PRIMARY_ICONS = { pair: 'radio', start: 'play', restart: 'refresh-cw', editConnection: 'edit-2' };

// Where the service is started
export const SERVICES_URL = '/dashboard/settings/service';

// With an external broker, starting is connecting Gladys to it again
export const getPrimaryLabel = (primaryAction, configuration) =>
  primaryAction === 'start' && isExternal(configuration) ? `${T}.actions.connect` : PRIMARY_LABELS[primaryAction];

// The state of Zigbee2mqtt, why it does not run, and the action to take
const StatusCard = ({ view, actions }) => {
  const { state, status, primaryAction, actionStatus, newDeviceCount } = view;
  const startupError = state === DASHBOARD_STATE.FAILED ? getStartupError(status) : null;
  const brokerError = state === DASHBOARD_STATE.MQTT_ERROR ? getBrokerError(status) : null;
  const busy = actionStatus === RequestStatus.Getting;
  return (
    <section class={style.card} data-cy="z2m-dashboard-status" data-state={state}>
      <div class={style.statusHead}>
        <span class={cx(style.statusIcon, TONES[state])} aria-hidden="true">
          <i
            class={cx(`fe fe-${ICONS[state]}`, {
              [style.spin]: WORKING_STATES.includes(state)
            })}
          />
        </span>
        <div class={style.statusText}>
          <span class={style.statusTitle} role="status" data-cy="z2m-dashboard-title">
            <Title view={view} />
          </span>
          <span class={style.statusSub} data-cy="z2m-dashboard-subtitle">
            <Subtitle view={view} />
          </span>
        </div>
      </div>

      {state === DASHBOARD_STATE.ONLINE && newDeviceCount > 0 && (
        <Link href={DISCOVER_URL} class={style.newDevices} data-cy="z2m-dashboard-new-devices">
          <Text id={`${T}.newDevices`} plural={newDeviceCount} fields={{ count: newDeviceCount }} />
          <i class="fe fe-chevron-right" aria-hidden="true" />
        </Link>
      )}
      {state === DASHBOARD_STATE.INSTALLING && <Progress view={view} />}
      {startupError && (
        <div class="alert alert-danger mb-0" role="alert" data-cy="z2m-dashboard-error">
          <InstallFailure error={startupError} networkCoordinator={isNetworkCoordinator(view.configuration)} />
        </div>
      )}
      {brokerError && (
        <div class="alert alert-danger mb-0" role="alert" data-cy="z2m-dashboard-mqtt-error">
          <MqttConnectionError error={brokerError} />
        </div>
      )}
      <TooOldNotice view={view} />
      {view.installationSucceeded && (
        <div class="alert alert-success mb-0" data-cy="z2m-dashboard-installation-success">
          <Text
            id={`integration.zigbee2mqtt.setup.installation.success.${status.installation.kind}`}
            fields={{ duration: formatDuration(status.installation.durationMs) }}
          />
        </div>
      )}
      {status.updatePending && state !== DASHBOARD_STATE.INSTALLING && (
        <div class="alert alert-info mb-0" data-cy="z2m-dashboard-update-pending">
          <Text id={`${T}.updatePending`} />
        </div>
      )}
      {view.ezspDriver && (
        <div class="alert alert-info mb-0" data-cy="z2m-dashboard-ezsp">
          <MarkupText id="integration.zigbee2mqtt.setup.wizard.ready.ezspNote" />
        </div>
      )}
      {view.actionError && (
        <div class="alert alert-warning mb-0" role="alert" data-cy="z2m-dashboard-action-error">
          <Text id={`${T}.actionErrors.${view.actionError}`} />
        </div>
      )}

      {(primaryAction || view.canChangeKey || state === DASHBOARD_STATE.INACTIVE) && (
        <div class={style.buttons}>
          {primaryAction && (
            <button
              type="button"
              class={cx('btn btn-primary', { 'btn-loading': busy })}
              disabled={busy}
              onClick={actions[primaryAction]}
              data-cy={`z2m-dashboard-${primaryAction}`}
            >
              <i class={`fe fe-${PRIMARY_ICONS[primaryAction]} mr-2`} aria-hidden="true" />
              <Text id={getPrimaryLabel(primaryAction, view.configuration)} />
            </button>
          )}
          {state === DASHBOARD_STATE.INACTIVE && (
            <Link href={SERVICES_URL} class="btn btn-primary" data-cy="z2m-dashboard-services">
              <Text id={`${T}.actions.services`} />
            </Link>
          )}
          {view.canChangeKey && state === DASHBOARD_STATE.FAILED && (
            <button
              type="button"
              class="btn btn-outline-primary"
              onClick={actions.changeKey}
              data-cy="z2m-dashboard-failure-change-key"
            >
              <Text id="integration.zigbee2mqtt.setup.wizard.failure.changeKey" />
            </button>
          )}
        </div>
      )}
    </section>
  );
};

export default StatusCard;
