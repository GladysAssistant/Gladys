import { Component } from 'preact';
import { Text, MarkupText } from 'preact-i18n';
import cx from 'classnames';

import {
  FocusPage,
  MobileNavBar,
  MobileSteps,
  MobileBottomBar,
  BigButton,
  MobileGroup,
  MobileRow,
  MobileNotice,
  MobileField,
  MobileSectionHeader,
  fieldClass,
  kitStyle
} from '../../../../../../components/mobile';
import BottomSheet from '../../../../../../components/sheet/BottomSheet';
import { getBackToCatalogUrl } from '../../../../catalog-url';
import { RequestStatus } from '../../../../../../utils/consts';
import PrefetchStatus from '../components/PrefetchStatus';
import { findAdapter, getPortPath } from './adapters';
import { STEP, PANE, KEY_SCENARIO, INSTALL_VIEW, NETWORK_ADAPTER_TYPES } from './constants';
import { getPhases, getCurrentPhase } from './phases';
import { DISCOVER_URL, getDriver, getStepNumber, getStepLabels, getSummary, getTitle } from './WizardDesktop';
import { getInstallLabel, isCurrentPort } from './DesktopStepKey';
import InstallFailure from './InstallFailure';
import WaitingText from './WaitingText';
import KeyPhoto from './KeyPhoto';
import ModelPicker from './ModelPicker';
import style from './wizard.css';

const T = 'integration.zigbee2mqtt.setup.wizard';
const SHEET = { OTHER: 'other', PORT: 'port' };

const Selected = () => <i class={cx('fe fe-check', style.mobileCheck)} aria-hidden="true" />;

const Heading = ({ title, text, fields, center }) => (
  <div class={cx({ [style.mobileCenter]: center })}>
    <h2 class={style.mobileTitle} data-cy="z2m-wizard-key-title">
      <Text id={title} fields={fields} />
    </h2>
    {text && (
      <p class={kitStyle.lead}>
        <Text id={text} />
      </p>
    )}
  </div>
);

const OtherChoicesLink = ({ onClick }) => (
  <button type="button" class={style.mobileLink} onClick={onClick} data-cy="z2m-wizard-other-choices">
    <Text id={`${T}.mobile.otherChoices`} />
  </button>
);

// m01: the dongle in large, nothing to choose
const KeyOne = ({ view, openOther }) => {
  const usbPort = view.usbPorts.find(port => port.adapter);
  const adapter = findAdapter(view.adapters, usbPort.adapter);
  return (
    <div class={style.mobileHero} data-cy="z2m-wizard-key-one">
      <KeyPhoto adapter={adapter} size={148} />
      <h2 class={style.mobileTitle} data-cy="z2m-wizard-key-name">
        {adapter ? adapter.displayName : usbPort.adapter}
      </h2>
      {adapter && adapter.modelCode && (
        <span class="text-muted">
          <Text id={`${T}.mobile.modelCode`} fields={{ code: adapter.modelCode }} />
        </span>
      )}
      <span class={style.mobileRecognized} data-cy={view.justPlugged ? 'z2m-wizard-just-plugged' : undefined}>
        <i class="fe fe-check" aria-hidden="true" />
        <Text id={view.justPlugged ? `${T}.mobile.justPlugged` : `${T}.mobile.recognized`} />
      </span>
      {isCurrentPort(usbPort, view) && (
        <span class="text-muted" data-cy="z2m-wizard-current-key">
          <Text id={`${T}.change.current`} />
        </span>
      )}
      <OtherChoicesLink onClick={openOther} />
    </div>
  );
};

// w02: the recognized dongles as radio rows
const KeySeveral = ({ view, actions, openOther }) => {
  const recognized = view.usbPorts.filter(port => port.adapter);
  return (
    <div data-cy="z2m-wizard-key-several">
      <Heading title={`${T}.key.severalTitle`} text={`${T}.key.severalText`} fields={{ count: recognized.length }} />
      <MobileGroup>
        {recognized.map(usbPort => {
          const adapter = findAdapter(view.adapters, usbPort.adapter);
          const selected = view.selectedPort === usbPort;
          return (
            <MobileRow
              key={usbPort.path}
              tile={<KeyPhoto adapter={adapter} size={44} />}
              title={adapter ? adapter.displayName : usbPort.adapter}
              subtitle={[adapter && adapter.modelCode, usbPort.path].filter(Boolean).join(' · ')}
              meta={isCurrentPort(usbPort, view) && <Text id={`${T}.change.current`} />}
              trailing={selected && <Selected />}
              chevron={false}
              aria-pressed={selected ? 'true' : 'false'}
              onClick={() => actions.pickPort(getPortPath(usbPort))}
              dataCy="z2m-wizard-key-card"
            />
          );
        })}
      </MobileGroup>
      <OtherChoicesLink onClick={openOther} />
    </div>
  );
};

// m03: waiting for a dongle
const KeyNone = ({ openOther }) => (
  <div class={style.mobileHero} data-cy="z2m-wizard-key-none">
    <span class={style.waitingIcon} aria-hidden="true">
      <i class="fe fe-cpu" />
    </span>
    <Heading title={`${T}.key.noneTitle`} text={`${T}.key.noneText`} center />
    <span role="status" class="text-primary font-weight-bold">
      <i class={cx('fe fe-loader mr-2', style.spin)} aria-hidden="true" />
      <Text id={`${T}.key.waiting`} />
    </span>
    <div class={style.tip}>
      <MarkupText id={`${T}.key.tip`} />
    </div>
    <OtherChoicesLink onClick={openOther} />
  </div>
);

// m04: the model of a dongle Gladys does not recognize, or a dongle chosen by hand
const KeyModel = ({ view, actions, manual, openPort, openOther }) => {
  const { selectedPort, selectedModel, choosableAdapters, loadAdaptersStatus } = view;
  return (
    <div data-cy={manual ? 'z2m-wizard-manual' : 'z2m-wizard-key-unknown'}>
      <Heading
        title={`${T}.mobile.modelTitle`}
        text={manual ? `${T}.mobile.modelTextManual` : `${T}.mobile.modelTextUnknown`}
      />
      <MobileGroup>
        <MobileRow
          icon="cpu"
          title={<Text id={`${T}.key.portLabel`} />}
          subtitle={selectedPort ? selectedPort.name || selectedPort.path : <Text id={`${T}.key.choosePort`} />}
          meta={selectedPort && selectedPort.name ? selectedPort.path : null}
          onClick={openPort}
          dataCy="z2m-wizard-port-row"
        />
      </MobileGroup>
      <MobileSectionHeader title={<Text id={`${T}.key.modelLabel`} />} />
      {loadAdaptersStatus === RequestStatus.Error ? (
        <MobileNotice tone="danger" data-cy="z2m-wizard-adapters-error">
          <Text id={`${T}.key.adaptersError`} />
        </MobileNotice>
      ) : (
        <ModelPicker adapters={choosableAdapters} value={selectedModel} onPick={actions.pickModel} withPhotos inline />
      )}
      {!manual && <OtherChoicesLink onClick={openOther} />}
    </div>
  );
};

const NetworkCoordinator = ({ view, actions }) => (
  <div data-cy="z2m-wizard-network">
    <Heading title={`${T}.network.title`} text={`${T}.network.text`} />
    <MobileField
      label={<Text id={`${T}.network.urlLabel`} />}
      help={<Text id={`${T}.network.urlHint`} />}
      htmlFor="z2mWizardNetworkUrl"
    >
      <input
        id="z2mWizardNetworkUrl"
        type="url"
        inputmode="url"
        autocapitalize="off"
        autocomplete="off"
        class={fieldClass.input}
        placeholder="tcp://192.168.1.20:6638"
        value={view.networkUrl}
        onInput={e => actions.updateField('networkUrl', e.target.value)}
        data-cy="z2m-wizard-network-url"
      />
    </MobileField>
    <MobileSectionHeader title={<Text id={`${T}.network.typeLabel`} />} />
    <MobileGroup>
      {NETWORK_ADAPTER_TYPES.map(type => (
        <MobileRow
          key={type}
          title={<Text id={`${T}.network.types.${type}`} />}
          trailing={view.networkType === type && <Selected />}
          chevron={false}
          aria-pressed={view.networkType === type ? 'true' : 'false'}
          onClick={() => actions.updateField('networkType', type)}
          dataCy="z2m-wizard-network-type-row"
        />
      ))}
    </MobileGroup>
  </div>
);

const EXTERNAL_FIELDS = [
  { field: 'mqttUrl', label: 'urlLabel', type: 'url', inputmode: 'url', placeholder: 'mqtt://192.168.1.10:1883' },
  { field: 'mqttUsername', label: 'usernameLabel', type: 'text', autocomplete: 'username' },
  { field: 'mqttPassword', label: 'passwordLabel', type: 'password', autocomplete: 'new-password' },
  {
    field: 'z2mFrontendUrl',
    label: 'frontendUrlLabel',
    type: 'url',
    inputmode: 'url',
    placeholder: 'http://192.168.1.10:8080',
    optional: true
  }
];

const ExternalBroker = ({ view, actions }) => (
  <div data-cy="z2m-wizard-external">
    <Heading title={`${T}.external.title`} text={`${T}.external.text`} />
    {EXTERNAL_FIELDS.map(({ field, label, type, inputmode, placeholder, autocomplete, optional }) => (
      <MobileField
        key={field}
        htmlFor={`z2mWizard-${field}`}
        label={
          <span>
            <Text id={`${T}.external.${label}`} />
            {optional && (
              <span class="text-muted font-weight-normal">
                {' '}
                <Text id={`${T}.external.optional`} />
              </span>
            )}
          </span>
        }
      >
        <input
          id={`z2mWizard-${field}`}
          type={type}
          inputmode={inputmode}
          autocapitalize="off"
          autocomplete={autocomplete || 'off'}
          class={fieldClass.input}
          placeholder={placeholder}
          value={view[field]}
          onInput={e => actions.updateField(field, e.target.value)}
          data-cy={`z2m-wizard-${field}`}
        />
      </MobileField>
    ))}
  </div>
);

const Incompatible = () => (
  <div data-cy="z2m-wizard-incompatible">
    <MobileNotice tone="warning" icon="alert-triangle">
      <strong class="d-block mb-1">
        <Text id={`${T}.incompatible.title`} />
      </strong>
      <MarkupText id={`${T}.incompatible.text`} />
    </MobileNotice>
    <h2 class={style.mobileTitle}>
      <Text id={`${T}.incompatible.elsewhereTitle`} />
    </h2>
    <p class={kitStyle.lead}>
      <Text id={`${T}.incompatible.elsewhereText`} />
    </p>
  </div>
);

// The progress around the photo of the dongle (m05, m06)
const Ring = ({ progress, failed, adapter }) => {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  return (
    <span class={style.ring}>
      <svg viewBox="0 0 160 160" aria-hidden="true">
        <circle class={style.ringTrack} cx="80" cy="80" r={radius} />
        <circle
          class={cx(style.ringValue, { [style.ringFailed]: failed })}
          cx="80"
          cy="80"
          r={radius}
          stroke-dasharray={circumference}
          stroke-dashoffset={circumference * (1 - progress / 100)}
        />
      </svg>
      <KeyPhoto adapter={adapter} size={108} round />
    </span>
  );
};

// ② The installation: a ring, the phase in progress, the phases folded
const Install = ({ view }) => {
  const { installView, external, savedConfiguration, savedAdapter, zigbee2mqttStatus } = view;
  const starting = installView === INSTALL_VIEW.STARTING;
  const installation = starting ? null : zigbee2mqttStatus.installation;
  const failed = installView === INSTALL_VIEW.FAILED;
  const waiting = installView === INSTALL_VIEW.WAITING;
  const ezspFallback = Boolean(zigbee2mqttStatus.ezspFallback);
  const phases = getPhases(installation, { configuration: savedConfiguration, external, ezspFallback });
  const current = getCurrentPhase(phases);
  const progress = installation ? installation.progress : 0;
  return (
    <div class={style.mobileHero} data-cy="z2m-wizard-install-step">
      <Ring progress={failed ? 100 : progress} failed={failed} adapter={external ? null : savedAdapter} />
      {failed ? (
        <div class={style.mobileFailure} role="alert">
          <InstallFailure error={zigbee2mqttStatus.installation && zigbee2mqttStatus.installation.error} />
        </div>
      ) : (
        <div class={style.mobileCenter}>
          <span role="status" class={style.mobilePercent} data-cy="z2m-wizard-progress">
            {progress} %
          </span>
          <span class="d-block font-weight-bold" data-cy="z2m-wizard-current-phase">
            <Text id={current.detail || current.label} />
          </span>
          {!waiting && (
            <span class="text-muted" data-cy="z2m-wizard-leave-page">
              <Text id={`${T}.progress.leavePage`} />
            </span>
          )}
        </div>
      )}
      {waiting && (
        <MobileNotice role="status" data-cy="z2m-wizard-waiting-zigbee2mqtt">
          <WaitingText status={zigbee2mqttStatus} />
        </MobileNotice>
      )}
      {ezspFallback && !failed && !external && (
        <MobileNotice data-cy="z2m-wizard-ezsp-note">
          <MarkupText id={`${T}.progress.ezspNote`} />
        </MobileNotice>
      )}
      <details class={style.mobileDetails}>
        <summary>
          <Text id={`${T}.mobile.showPhases`} />
        </summary>
        <MobileGroup>
          {phases.map(phase => (
            <MobileRow
              key={phase.key}
              icon={{ done: 'check', skipped: 'check', failed: 'x', running: 'loader' }[phase.state] || 'circle'}
              iconTone={{ done: 'success', skipped: 'success', failed: 'danger' }[phase.state] || 'neutral'}
              title={<Text id={phase.label} />}
              subtitle={phase.detail && <Text id={phase.detail} />}
              dataCy="z2m-wizard-phase"
              data-state={phase.state}
            />
          ))}
        </MobileGroup>
      </details>
    </div>
  );
};

// ③ The network ready
const Ready = ({ view }) => {
  const { external, savedAdapter } = view;
  return (
    <div class={style.mobileHero} data-cy="z2m-wizard-ready">
      <span class={style.readyPhoto}>
        <KeyPhoto adapter={external ? null : savedAdapter} size={108} round />
        <span class={style.readyBadge} aria-hidden="true">
          <i class="fe fe-check" />
        </span>
      </span>
      <h2 class={style.mobileTitle}>
        <Text id={`${T}.ready.title`} />
      </h2>
      {!external && savedAdapter && <span class="text-muted">{savedAdapter.displayName}</span>}
      <MobileGroup class={style.mobileFull}>
        {getSummary(view).map(row => (
          <MobileRow
            key={row.key}
            title={<Text id={`${T}.ready.${row.key}`} />}
            value={
              (row.driver === 'ezsp' && <Text id={`${T}.ready.ezspDriver`} />) ||
              row.value || <Text id={`${T}.ready.unknown`} />
            }
            dataCy={`z2m-wizard-summary-${row.key}`}
          />
        ))}
      </MobileGroup>
      {!external && getDriver(view) === 'ezsp' && (
        <MobileNotice class={style.mobileFull} data-cy="z2m-wizard-ready-ezsp">
          <MarkupText id={`${T}.ready.ezspNote`} />
        </MobileNotice>
      )}
    </div>
  );
};

const TIPS = ['approach', 'mode', 'add'];

// ④ The first device
const Pair = ({ view }) => (
  <div data-cy="z2m-wizard-pair-step">
    <h2 class={style.mobileTitle}>
      <Text id={`${T}.pair.title`} />
    </h2>
    <p class={kitStyle.lead}>
      <Text id={`${T}.pair.text`} />
    </p>
    <MobileGroup>
      {TIPS.map((tip, index) => (
        <MobileRow
          key={tip}
          tile={<span class={style.tipNumber}>{index + 1}</span>}
          title={<Text id={`${T}.pair.tips.${tip}.title`} />}
          subtitle={<Text id={`${T}.pair.tips.${tip}.text`} />}
        />
      ))}
    </MobileGroup>
    {view.permitJoinStatus === RequestStatus.Success && (
      <MobileNotice tone="success" icon="check" role="status" data-cy="z2m-wizard-permit-join-allowed">
        <MarkupText id={`${T}.pair.allowed`} />
      </MobileNotice>
    )}
  </div>
);

// What the refused setup says, in the bottom bar
const getSaveError = view => {
  const { setupZigee2mqttStatus, setupZigee2mqttError, saveErrorClosed } = view;
  if (saveErrorClosed) {
    return null;
  }
  if (setupZigee2mqttStatus === RequestStatus.ConflictError) {
    return <Text id="integration.zigbee2mqtt.setup.installation.alreadyRunning" />;
  }
  if (setupZigee2mqttStatus === RequestStatus.Error) {
    return setupZigee2mqttError === 'DONGLE_NOT_FOUND' ? (
      <Text id={`${T}.saveDongleNotFound`} />
    ) : (
      <Text id="integration.zigbee2mqtt.setup.saveError" />
    );
  }
  return null;
};

/**
 * @description The wizard on a phone (docs/specs/zigbee2mqtt-installation.md, M.3): a focus page, one decision
 * per screen, the way forward in the bottom bar, the other ways in a sheet. Same view and actions as the desktop.
 */
class WizardMobile extends Component {
  openOther = () => this.setState({ sheet: SHEET.OTHER });
  openPort = () => this.setState({ sheet: SHEET.PORT });
  closeSheet = () => this.setState({ sheet: null });

  // A choice of the "other choice" sheet
  choose = action => () => {
    this.closeSheet();
    action();
  };

  pickPort = path => () => {
    this.closeSheet();
    this.props.actions.pickPort(path);
  };

  renderKey() {
    const { view, actions } = this.props;
    const { pane, keyScenario, installable, loadUsbPortsStatus } = view;
    if (pane === PANE.MANUAL) {
      return <KeyModel view={view} actions={actions} manual openPort={this.openPort} />;
    }
    if (pane === PANE.NETWORK) {
      return <NetworkCoordinator view={view} actions={actions} />;
    }
    if (pane === PANE.EXTERNAL) {
      return <ExternalBroker view={view} actions={actions} />;
    }
    if (!installable) {
      return <Incompatible />;
    }
    if (loadUsbPortsStatus === RequestStatus.Getting) {
      return <div class={cx('loader', style.loader)} />;
    }
    if (loadUsbPortsStatus === RequestStatus.Error) {
      return (
        <div>
          <MobileNotice tone="danger" data-cy="z2m-wizard-ports-error">
            <Text id={`${T}.key.portsError`} />
          </MobileNotice>
          <OtherChoicesLink onClick={this.openOther} />
        </div>
      );
    }
    if (keyScenario === KEY_SCENARIO.ONE) {
      return <KeyOne view={view} openOther={this.openOther} />;
    }
    if (keyScenario === KEY_SCENARIO.SEVERAL) {
      return <KeySeveral view={view} actions={actions} openOther={this.openOther} />;
    }
    if (keyScenario === KEY_SCENARIO.UNKNOWN) {
      return <KeyModel view={view} actions={actions} openPort={this.openPort} openOther={this.openOther} />;
    }
    return <KeyNone openOther={this.openOther} />;
  }

  // The way forward of each screen, and the way back to the detected dongle from another choice
  renderButtons() {
    const { view, actions } = this.props;
    const { step, pane, installView, installable, external, saving, permitJoinStatus } = view;
    if (step === STEP.KEY) {
      if (pane === PANE.AUTO && !installable) {
        return (
          <BigButton variant="primary" onClick={actions.showExternal} data-cy="z2m-wizard-use-external">
            <Text id={`${T}.incompatible.useExternal`} />
          </BigButton>
        );
      }
      const back = pane !== PANE.AUTO && (
        <BigButton fit icon="arrow-left" onClick={actions.showAuto} data-cy="z2m-wizard-show-auto">
          <Text id={`${T}.mobile.back`} />
        </BigButton>
      );
      // Nothing to install while no dongle is plugged in
      if (pane === PANE.AUTO && view.keyScenario === KEY_SCENARIO.NONE) {
        return null;
      }
      return [
        back,
        <BigButton
          variant="primary"
          loading={saving}
          disabled={!view.configurationToSave}
          onClick={actions.install}
          data-cy="z2m-wizard-install"
        >
          <Text id={getInstallLabel(view)} />
        </BigButton>
      ];
    }
    if (step === STEP.INSTALL && installView === INSTALL_VIEW.FAILED) {
      return (
        <div class={style.mobileBarStack}>
          <BigButton
            variant="primary"
            icon="refresh-cw"
            loading={saving}
            onClick={actions.retry}
            data-cy="z2m-wizard-retry"
          >
            <Text id={`${T}.failure.retry`} />
          </BigButton>
          <BigButton onClick={actions.changeKey} data-cy="z2m-wizard-change-key">
            <Text id={external ? `${T}.failure.changeConnection` : `${T}.failure.changeKey`} />
          </BigButton>
        </div>
      );
    }
    if (step === STEP.INSTALL && installView === INSTALL_VIEW.WAITING) {
      return (
        <BigButton onClick={actions.changeKey} data-cy="z2m-wizard-change-key">
          <Text id={`${T}.failure.changeConnection`} />
        </BigButton>
      );
    }
    if (step === STEP.INSTALL && installView === INSTALL_VIEW.READY) {
      return (
        <div class={style.mobileBarStack}>
          <BigButton variant="primary" onClick={actions.showPairing} data-cy="z2m-wizard-pair">
            <Text id={`${T}.ready.pair`} />
          </BigButton>
          <BigButton variant="ghost" onClick={actions.finish} data-cy="z2m-wizard-later">
            <Text id={`${T}.ready.later`} />
          </BigButton>
        </div>
      );
    }
    if (step === STEP.PAIR) {
      return permitJoinStatus === RequestStatus.Success ? (
        <div class={style.mobileBarStack}>
          <BigButton variant="primary" href={DISCOVER_URL} data-cy="z2m-wizard-go-to-discover">
            <Text id={`${T}.pair.goToDiscover`} />
          </BigButton>
          <BigButton variant="ghost" onClick={actions.finish} data-cy="z2m-wizard-finish">
            <Text id={`${T}.pair.finish`} />
          </BigButton>
        </div>
      ) : (
        <div class={style.mobileBarStack}>
          <BigButton
            variant="primary"
            icon="radio"
            loading={permitJoinStatus === RequestStatus.Getting}
            onClick={actions.allowJoining}
            data-cy="z2m-wizard-allow-joining"
          >
            <Text id={`${T}.pair.allow`} />
          </BigButton>
          <BigButton variant="ghost" onClick={actions.finish} data-cy="z2m-wizard-finish">
            <Text id={`${T}.pair.finishWithoutPairing`} />
          </BigButton>
        </div>
      );
    }
    // The installation goes on without the page: nothing to do meanwhile
    return null;
  }

  renderBarError() {
    const { view, actions } = this.props;
    if (view.step === STEP.KEY) {
      const error = getSaveError(view);
      return error && { message: error, close: actions.closeSaveError };
    }
    if (view.step === STEP.PAIR && view.permitJoinStatus === RequestStatus.Error) {
      return { message: <Text id={`${T}.pair.allowError`} />, close: actions.closePermitJoinError };
    }
    return null;
  }

  render({ view, actions }, { sheet }) {
    const current = getStepNumber(view);
    const labels = getStepLabels(view.connectOnly);
    const buttons = this.renderButtons();
    const error = this.renderBarError();
    // Two actions one above the other after the first step: the content stays clear of both
    const stacked = Boolean(buttons) && view.step !== STEP.KEY;
    const otherChoices = [
      view.installable && {
        key: 'manual',
        icon: 'cpu',
        action: actions.showManual
      },
      view.installable && { key: 'network', icon: 'wifi', action: actions.showNetwork },
      { key: 'external', icon: 'share-2', action: actions.showExternal }
    ].filter(Boolean);
    return (
      <FocusPage>
        <div class={kitStyle.page} data-cy="z2m-wizard-mobile">
          {view.changeMode ? (
            <MobileNavBar
              title={<Text id={getTitle(view)} />}
              onBack={actions.cancel}
              backLabel={<Text id="integration.zigbee2mqtt.setupTab" />}
            />
          ) : (
            <MobileNavBar
              title={<Text id={getTitle(view)} />}
              backHref={getBackToCatalogUrl()}
              backLabel={<Text id="header.integrations" />}
            />
          )}
          <div
            class={cx(kitStyle.content, {
              [kitStyle.contentWithBottomBar]: buttons || error,
              [style.mobileContentStacked]: stacked
            })}
            data-cy="z2m-wizard"
          >
            {!view.changeMode && (
              <MobileSteps current={current} total={4} label={<Text id={`${T}.steps.${labels[current - 1]}`} />} />
            )}
            <div class={style.mobileStep}>
              {view.step === STEP.KEY && this.renderKey()}
              {view.step === STEP.KEY && view.otherDriverFamily && (
                <MobileNotice tone="warning" icon="alert-triangle" data-cy="z2m-wizard-other-family">
                  <Text id={`${T}.change.otherFamily`} />
                </MobileNotice>
              )}
              {view.step === STEP.KEY && view.pane !== PANE.EXTERNAL && (
                <PrefetchStatus configuration={view.configuration} zigbee2mqttStatus={view.zigbee2mqttStatus} />
              )}
              {view.step === STEP.INSTALL && view.installView !== INSTALL_VIEW.READY && <Install view={view} />}
              {view.step === STEP.INSTALL && view.installView === INSTALL_VIEW.READY && <Ready view={view} />}
              {view.step === STEP.PAIR && <Pair view={view} />}
            </div>
          </div>
          {(buttons || error) && (
            <MobileBottomBar
              error={error && error.message}
              onCloseError={error && error.close}
              dataCy="z2m-wizard-bottom-bar"
            >
              {buttons}
            </MobileBottomBar>
          )}
          <BottomSheet
            open={sheet === SHEET.OTHER}
            title={<Text id={`${T}.mobile.otherTitle`} />}
            onClose={this.closeSheet}
            dataCy="z2m-wizard-other-sheet"
          >
            <MobileGroup>
              {otherChoices.map(choice => (
                <MobileRow
                  key={choice.key}
                  icon={choice.icon}
                  title={<Text id={`${T}.mobile.other.${choice.key}.title`} />}
                  subtitle={<Text id={`${T}.mobile.other.${choice.key}.text`} />}
                  onClick={this.choose(choice.action)}
                  dataCy={`z2m-wizard-show-${choice.key}`}
                />
              ))}
            </MobileGroup>
          </BottomSheet>
          <BottomSheet
            open={sheet === SHEET.PORT}
            title={<Text id={`${T}.key.portLabel`} />}
            onClose={this.closeSheet}
            dataCy="z2m-wizard-port-sheet"
          >
            <MobileGroup>
              {view.choosablePorts.map(usbPort => (
                <MobileRow
                  key={usbPort.path}
                  title={usbPort.name || usbPort.path}
                  subtitle={usbPort.name ? usbPort.path : null}
                  trailing={view.selectedPort === usbPort && <Selected />}
                  chevron={false}
                  onClick={this.pickPort(getPortPath(usbPort))}
                  dataCy="z2m-wizard-port-option"
                />
              ))}
            </MobileGroup>
            {view.choosablePorts.length < view.usbPorts.length && (
              <button
                type="button"
                class={style.mobileLink}
                onClick={actions.showAllPorts}
                data-cy="z2m-wizard-show-all-ports"
              >
                <Text id={`${T}.key.showAllPorts`} />
              </button>
            )}
          </BottomSheet>
        </div>
      </FocusPage>
    );
  }
}

export default WizardMobile;
