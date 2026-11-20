import { Text, MarkupText, Localizer } from 'preact-i18n';
import { Link } from 'preact-router/match';
import cx from 'classnames';
import get from 'get-value';

import { RequestStatus } from '../../../../../../utils/consts';
import { ADAPTER_MODE } from '../constants';
import { formatDuration } from './format';
import { STEP, INSTALL_VIEW } from './constants';
import DesktopStepKey from './DesktopStepKey';
import DesktopStepInstall from './DesktopStepInstall';
import KeyChip from './KeyChip';
import style from './wizard.css';

const T = 'integration.zigbee2mqtt.setup.wizard';
export const DISCOVER_URL = '/dashboard/integration/device/zigbee2mqtt/discover';

// 1 to 4: the dongle, the installation, the network ready, the first device
export const getStepNumber = view => {
  if (view.step === STEP.KEY) {
    return 1;
  }
  if (view.step === STEP.PAIR) {
    return 4;
  }
  return view.installView === INSTALL_VIEW.READY ? 3 : 2;
};

export const getStepLabels = external =>
  external ? ['connection', 'check', 'network', 'device'] : ['key', 'install', 'network', 'device'];

const Stepper = ({ current, external, failed }) => (
  <Localizer>
    <ol class={style.stepper} aria-label={<Text id={`${T}.stepsLabel`} />}>
      {getStepLabels(external).map((label, index) => {
        const number = index + 1;
        return (
          <li
            key={label}
            class={cx(style.stepperItem, {
              [style.stepperDone]: number < current,
              [style.stepperCurrent]: number === current,
              [style.stepperFailed]: failed && number === current
            })}
            aria-current={number === current ? 'step' : undefined}
            data-cy="z2m-wizard-stepper-item"
          >
            <span class={style.stepperCircle}>
              {number < current ? <i class="fe fe-check" aria-hidden="true" /> : number}
            </span>
            <span class={style.stepperLabel}>
              <Text id={`${T}.steps.${label}`} />
            </span>
          </li>
        );
      })}
    </ol>
  </Localizer>
);

// The driver Zigbee2mqtt talks to the coordinator with: the one of the dongle model, or the network coordinator type
export const getDriver = view => {
  const { savedConfiguration, savedAdapter } = view;
  if (savedConfiguration.z2mAdapterMode === ADAPTER_MODE.NETWORK) {
    return savedConfiguration.z2mNetworkAdapterType || null;
  }
  return savedAdapter ? savedAdapter.configKey : null;
};

// What the network ready step sums up: driver, firmware and duration, or the broker and what Zigbee2mqtt tells
export const getSummary = view => {
  const { external, savedConfiguration, zigbee2mqttStatus } = view;
  const { installation, coordinatorFirmware, z2mVersion, deviceCount } = zigbee2mqttStatus;
  if (external) {
    return [
      { key: 'broker', value: savedConfiguration.mqttUrl },
      { key: 'version', value: z2mVersion },
      { key: 'devices', value: Number.isInteger(deviceCount) ? `${deviceCount}` : null }
    ];
  }
  const driver = getDriver(view);
  const revision = get(coordinatorFirmware, 'revision');
  const durationMs = get(installation, 'state') === 'done' ? installation.durationMs : null;
  return [
    { key: 'driver', value: driver, driver },
    { key: 'firmware', value: revision !== undefined && revision !== null ? `${revision}` : null },
    { key: 'duration', value: Number.isFinite(durationMs) ? formatDuration(durationMs) : null }
  ];
};

const SummaryValue = ({ row }) => {
  if (!row.value) {
    return <Text id={`${T}.ready.unknown`} />;
  }
  if (row.driver === 'ezsp') {
    return <Text id={`${T}.ready.ezspDriver`} />;
  }
  return row.value;
};

const StepReady = ({ view, actions }) => {
  const { external, savedConfiguration, savedAdapter } = view;
  const network = savedConfiguration.z2mAdapterMode === ADAPTER_MODE.NETWORK;
  let text = `${T}.ready.textUsb`;
  if (external) {
    text = `${T}.ready.textExternal`;
  } else if (network) {
    text = `${T}.ready.textNetwork`;
  }
  return (
    <div class={style.ready} data-cy="z2m-wizard-ready">
      <span class={style.readyIcon} aria-hidden="true">
        <i class="fe fe-check" />
      </span>
      <h3 class="mb-1">
        <Text id={`${T}.ready.title`} />
      </h3>
      <p class="text-muted">
        <Text id={text} />
      </p>
      {!external && <KeyChip adapter={savedAdapter} configuration={savedConfiguration} />}
      <dl class={style.summary}>
        {getSummary(view).map(row => (
          <div class={style.summaryRow} key={row.key} data-cy={`z2m-wizard-summary-${row.key}`}>
            <dt>
              <Text id={`${T}.ready.${row.key}`} />
            </dt>
            <dd>
              <SummaryValue row={row} />
            </dd>
          </div>
        ))}
      </dl>
      {!external && getDriver(view) === 'ezsp' && (
        <div class={cx('alert alert-info', style.readyNote)} data-cy="z2m-wizard-ready-ezsp">
          <MarkupText id={`${T}.ready.ezspNote`} />
        </div>
      )}
      <div class={cx(style.buttons, 'justify-content-center')}>
        <button type="button" class="btn btn-primary" onClick={actions.showPairing} data-cy="z2m-wizard-pair">
          <Text id={`${T}.ready.pair`} />
          <i class="fe fe-arrow-right ml-2" aria-hidden="true" />
        </button>
        <button type="button" class="btn btn-link" onClick={actions.finish} data-cy="z2m-wizard-later">
          <Text id={`${T}.ready.later`} />
        </button>
      </div>
    </div>
  );
};

const TIPS = ['approach', 'mode', 'add'];

const StepPair = ({ view, actions }) => {
  const { permitJoinStatus } = view;
  const allowed = permitJoinStatus === RequestStatus.Success;
  return (
    <div data-cy="z2m-wizard-pair-step">
      <div class="mb-3">
        <h3 class="mb-1">
          <Text id={`${T}.pair.title`} />
        </h3>
        <p class="text-muted mb-0">
          <Text id={`${T}.pair.text`} />
        </p>
      </div>
      <ol class={style.tips}>
        {TIPS.map((tip, index) => (
          <li key={tip} class={style.tipCard}>
            <span class={style.tipNumber}>{index + 1}</span>
            <strong>
              <Text id={`${T}.pair.tips.${tip}.title`} />
            </strong>
            <span class="text-muted">
              <Text id={`${T}.pair.tips.${tip}.text`} />
            </span>
          </li>
        ))}
      </ol>
      {permitJoinStatus === RequestStatus.Error && (
        <div class="alert alert-danger" data-cy="z2m-wizard-permit-join-error">
          <Text id={`${T}.pair.allowError`} />
        </div>
      )}
      {allowed ? (
        <div>
          <div class="alert alert-success" role="status" data-cy="z2m-wizard-permit-join-allowed">
            <MarkupText id={`${T}.pair.allowed`} />
          </div>
          <div class={style.buttons}>
            <Link href={DISCOVER_URL} class="btn btn-primary" data-cy="z2m-wizard-go-to-discover">
              <Text id={`${T}.pair.goToDiscover`} />
              <i class="fe fe-arrow-right ml-2" aria-hidden="true" />
            </Link>
            <button type="button" class="btn btn-link" onClick={actions.finish} data-cy="z2m-wizard-finish">
              <Text id={`${T}.pair.finish`} />
            </button>
          </div>
        </div>
      ) : (
        <div class={style.buttons}>
          <button
            type="button"
            class={cx('btn btn-primary', { 'btn-loading': permitJoinStatus === RequestStatus.Getting })}
            onClick={actions.allowJoining}
            disabled={permitJoinStatus === RequestStatus.Getting}
            data-cy="z2m-wizard-allow-joining"
          >
            <i class="fe fe-radio mr-2" aria-hidden="true" />
            <Text id={`${T}.pair.allow`} />
          </button>
          <button type="button" class="btn btn-link" onClick={actions.finish} data-cy="z2m-wizard-finish">
            <Text id={`${T}.pair.finishWithoutPairing`} />
          </button>
        </div>
      )}
    </div>
  );
};

// The title of the wizard: install, connect to an external broker, or change the coordinator of an installation
export const getTitle = view => {
  if (view.changeMode) {
    return `${T}.change.title`;
  }
  return view.connectOnly ? `${T}.titleConnect` : `${T}.titleInstall`;
};

// The wizard on a large screen: the four steps above the current one, in a card
const WizardDesktop = ({ view, actions }) => {
  const current = getStepNumber(view);
  return (
    <div class={cx('card', style.wizard)} data-cy="z2m-wizard">
      <div class="card-header">
        <h2 class="card-title">
          <Text id={getTitle(view)} />
        </h2>
      </div>
      <div class="card-body">
        {!view.changeMode && (
          <Stepper
            current={current}
            external={view.connectOnly}
            failed={view.step === STEP.INSTALL && view.installView === INSTALL_VIEW.FAILED}
          />
        )}
        {view.step === STEP.KEY && <DesktopStepKey view={view} actions={actions} />}
        {view.step === STEP.INSTALL && view.installView !== INSTALL_VIEW.READY && (
          <DesktopStepInstall view={view} actions={actions} />
        )}
        {view.step === STEP.INSTALL && view.installView === INSTALL_VIEW.READY && (
          <StepReady view={view} actions={actions} />
        )}
        {view.step === STEP.PAIR && <StepPair view={view} actions={actions} />}
      </div>
    </div>
  );
};

export default WizardDesktop;
