import { Text, MarkupText } from 'preact-i18n';
import cx from 'classnames';

import { RequestStatus } from '../../../../../../utils/consts';
import PrefetchStatus from '../components/PrefetchStatus';
import { findAdapter, getPortPath } from './adapters';
import { PANE, KEY_SCENARIO, NETWORK_ADAPTER_TYPES } from './constants';
import KeyPhoto from './KeyPhoto';
import ModelPicker from './ModelPicker';
import style from './wizard.css';

const T = 'integration.zigbee2mqtt.setup.wizard';

const LinkButton = ({ onClick, children, dataCy }) => (
  <button type="button" class={cx('btn btn-link', style.linkButton)} onClick={onClick} data-cy={dataCy}>
    {children}
  </button>
);

const Heading = ({ title, text, fields }) => (
  <div class="mb-3">
    <h3 class="mb-1" data-cy="z2m-wizard-key-title">
      <Text id={title} fields={fields} />
    </h3>
    {text && (
      <p class="text-muted mb-0">
        <Text id={text} />
      </p>
    )}
  </div>
);

// The other ways: by hand, a network coordinator, a Zigbee2mqtt that runs elsewhere
const OtherChoices = ({ manualText, actions, installable }) => (
  <div class={style.otherChoices}>
    {installable && manualText && (
      <LinkButton onClick={actions.showManual} dataCy="z2m-wizard-show-manual">
        <Text id={manualText} />
      </LinkButton>
    )}
    {installable && (
      <LinkButton onClick={actions.showNetwork} dataCy="z2m-wizard-show-network">
        <Text id={`${T}.key.linkNetwork`} />
      </LinkButton>
    )}
    <LinkButton onClick={actions.showExternal} dataCy="z2m-wizard-show-external">
      <Text id={`${T}.key.linkExternal`} />
    </LinkButton>
  </div>
);

// port: shown when several dongles are offered, which may be of the same model
const KeyCard = ({ adapter, label, selected, onClick, recognized, port }) => {
  const content = (
    <span class="d-flex align-items-center w-100">
      {onClick && <span class={cx(style.radio, { [style.radioChecked]: selected })} aria-hidden="true" />}
      <KeyPhoto adapter={adapter} size={72} />
      <span class={cx('ml-3', style.keyCardText)}>
        <span class={style.keyCardName} data-cy="z2m-wizard-key-name">
          {adapter ? adapter.displayName : label}
        </span>
        <span class="text-muted">
          {adapter && adapter.modelCode ? (
            <Text id={`${T}.key.modelAndUsb`} fields={{ code: adapter.modelCode }} />
          ) : (
            <Text id={`${T}.key.usb`} />
          )}
          {port && <span data-cy="z2m-wizard-key-port"> · {port}</span>}
        </span>
      </span>
      {recognized && (
        <span class="badge badge-success ml-2">
          <Text id={`${T}.key.recognized`} />
        </span>
      )}
    </span>
  );
  if (!onClick) {
    return (
      <div class={cx(style.keyCard, style.keyCardSelected)} data-cy="z2m-wizard-key-card">
        {content}
      </div>
    );
  }
  return (
    <button
      type="button"
      class={cx(style.keyCard, { [style.keyCardSelected]: selected })}
      aria-pressed={selected ? 'true' : 'false'}
      onClick={onClick}
      data-cy="z2m-wizard-key-card"
    >
      {content}
    </button>
  );
};

const PortAndModel = ({ view, actions, title, text, backToDetected }) => {
  const {
    choosablePorts,
    usbPorts,
    selectedPort,
    selectedModel,
    choosableAdapters,
    showAllPorts,
    loadAdaptersStatus
  } = view;
  const hiddenPorts = !showAllPorts && choosablePorts.length < usbPorts.length;
  return (
    <div>
      <Heading title={title} text={text} />
      <div class="form-group">
        <label class="form-label" for="z2mWizardPort">
          <Text id={`${T}.key.portLabel`} />
        </label>
        <select
          id="z2mWizardPort"
          class="form-control custom-select"
          value={selectedPort ? getPortPath(selectedPort) : ''}
          onChange={e => actions.pickPort(e.target.value || null)}
          data-cy="z2m-wizard-port"
        >
          <option value="">
            <Text id={`${T}.key.choosePort`} />
          </option>
          {choosablePorts.map(usbPort => (
            <option key={usbPort.path} value={getPortPath(usbPort)}>
              {usbPort.name ? `${usbPort.name} (${usbPort.path})` : usbPort.path}
            </option>
          ))}
        </select>
        {hiddenPorts && (
          <LinkButton onClick={actions.showAllPorts} dataCy="z2m-wizard-show-all-ports">
            <Text id={`${T}.key.showAllPorts`} />
          </LinkButton>
        )}
      </div>
      <div class="form-group">
        <div class="form-label">
          <Text id={`${T}.key.modelLabel`} />
        </div>
        {loadAdaptersStatus === RequestStatus.Error ? (
          <div class="alert alert-danger" data-cy="z2m-wizard-adapters-error">
            <Text id={`${T}.key.adaptersError`} />
          </div>
        ) : (
          <ModelPicker adapters={choosableAdapters} value={selectedModel} onPick={actions.pickModel} />
        )}
        <small class="form-text text-muted">
          <Text id={`${T}.key.modelHint`} />
        </small>
      </div>
      {backToDetected && (
        <LinkButton onClick={actions.showAuto} dataCy="z2m-wizard-show-auto">
          <Text id={`${T}.key.backToDetected`} />
        </LinkButton>
      )}
    </div>
  );
};

const Detected = ({ view, actions }) => {
  const { keyScenario, usbPorts, adapters, selectedPort, justPlugged, installable } = view;
  if (!installable) {
    return (
      <div data-cy="z2m-wizard-incompatible">
        <div class="alert alert-warning">
          <strong class="d-block mb-1">
            <Text id={`${T}.incompatible.title`} />
          </strong>
          <MarkupText id={`${T}.incompatible.text`} />
        </div>
        <div class={style.elsewhere}>
          <div>
            <strong class="d-block">
              <Text id={`${T}.incompatible.elsewhereTitle`} />
            </strong>
            <span class="text-muted">
              <Text id={`${T}.incompatible.elsewhereText`} />
            </span>
          </div>
          <button
            type="button"
            class="btn btn-outline-primary"
            onClick={actions.showExternal}
            data-cy="z2m-wizard-use-external"
          >
            <Text id={`${T}.incompatible.useExternal`} />
          </button>
        </div>
      </div>
    );
  }
  if (view.loadUsbPortsStatus === RequestStatus.Getting) {
    return <div class={cx('loader', style.loader)} />;
  }
  if (view.loadUsbPortsStatus === RequestStatus.Error) {
    return (
      <div>
        <div class="alert alert-danger" data-cy="z2m-wizard-ports-error">
          <Text id={`${T}.key.portsError`} />
        </div>
        <OtherChoices actions={actions} installable={installable} />
      </div>
    );
  }
  const recognized = usbPorts.filter(usbPort => usbPort.adapter);
  if (keyScenario === KEY_SCENARIO.ONE) {
    return (
      <div data-cy="z2m-wizard-key-one">
        <Heading title={`${T}.key.detectedTitle`} text={`${T}.key.detectedText`} />
        {justPlugged && (
          <div class="alert alert-success" data-cy="z2m-wizard-just-plugged">
            <Text id={`${T}.key.justPlugged`} />
          </div>
        )}
        <KeyCard adapter={findAdapter(adapters, recognized[0].adapter)} label={recognized[0].adapter} recognized />
        <OtherChoices manualText={`${T}.key.linkManualWrong`} actions={actions} installable={installable} />
      </div>
    );
  }
  if (keyScenario === KEY_SCENARIO.SEVERAL) {
    return (
      <div data-cy="z2m-wizard-key-several">
        <Heading title={`${T}.key.severalTitle`} text={`${T}.key.severalText`} fields={{ count: recognized.length }} />
        {recognized.map(usbPort => (
          <KeyCard
            key={usbPort.path}
            adapter={findAdapter(adapters, usbPort.adapter)}
            label={usbPort.adapter}
            selected={selectedPort === usbPort}
            onClick={() => actions.pickPort(getPortPath(usbPort))}
            port={usbPort.path}
          />
        ))}
        <OtherChoices manualText={`${T}.key.linkManualSeveral`} actions={actions} installable={installable} />
      </div>
    );
  }
  if (keyScenario === KEY_SCENARIO.UNKNOWN) {
    return (
      <div data-cy="z2m-wizard-key-unknown">
        <PortAndModel view={view} actions={actions} title={`${T}.key.unknownTitle`} text={`${T}.key.unknownText`} />
        <OtherChoices actions={actions} installable={installable} />
      </div>
    );
  }
  return (
    <div class={style.waiting} data-cy="z2m-wizard-key-none">
      <span class={style.waitingIcon} aria-hidden="true">
        <i class="fe fe-cpu" />
      </span>
      <Heading title={`${T}.key.noneTitle`} text={`${T}.key.noneText`} />
      <span role="status" class="text-primary font-weight-bold mb-3">
        <i class={cx('fe fe-loader mr-2', style.spin)} aria-hidden="true" />
        <Text id={`${T}.key.waiting`} />
      </span>
      <p class={style.tip}>
        <MarkupText id={`${T}.key.tip`} />
      </p>
      <OtherChoices manualText={`${T}.key.linkManualNone`} actions={actions} installable={installable} />
    </div>
  );
};

const NetworkCoordinator = ({ view, actions }) => (
  <div data-cy="z2m-wizard-network">
    <Heading title={`${T}.network.title`} text={`${T}.network.text`} />
    <div class="form-group">
      <label class="form-label" for="z2mWizardNetworkUrl">
        <Text id={`${T}.network.urlLabel`} />
      </label>
      <input
        id="z2mWizardNetworkUrl"
        type="text"
        class="form-control"
        placeholder="tcp://192.168.1.20:6638"
        value={view.networkUrl}
        onInput={e => actions.updateField('networkUrl', e.target.value)}
        data-cy="z2m-wizard-network-url"
      />
      <small class="form-text text-muted">
        <Text id={`${T}.network.urlHint`} />
      </small>
    </div>
    <div class="form-group">
      <label class="form-label" for="z2mWizardNetworkType">
        <Text id={`${T}.network.typeLabel`} />
      </label>
      <select
        id="z2mWizardNetworkType"
        class="form-control custom-select"
        value={view.networkType || ''}
        onChange={e => actions.updateField('networkType', e.target.value || null)}
        data-cy="z2m-wizard-network-type"
      >
        <option value="">
          <Text id={`${T}.network.chooseType`} />
        </option>
        {NETWORK_ADAPTER_TYPES.map(type => (
          <option key={type} value={type}>
            <Text id={`${T}.network.types.${type}`} />
          </option>
        ))}
      </select>
    </div>
    <LinkButton onClick={actions.showAuto} dataCy="z2m-wizard-show-auto">
      <Text id={`${T}.key.backToUsb`} />
    </LinkButton>
  </div>
);

const ExternalField = ({ id, field, type = 'text', placeholder, view, actions, label, optional }) => (
  <div class="form-group">
    <label class="form-label" for={id}>
      <Text id={label} />
      {optional && (
        <span class="text-muted font-weight-normal">
          {' '}
          <Text id={`${T}.external.optional`} />
        </span>
      )}
    </label>
    <input
      id={id}
      type={type}
      class="form-control"
      placeholder={placeholder}
      value={view[field]}
      onInput={e => actions.updateField(field, e.target.value)}
      autocomplete={type === 'password' ? 'new-password' : 'off'}
      data-cy={`z2m-wizard-${field}`}
    />
  </div>
);

const ExternalBroker = ({ view, actions }) => (
  <div data-cy="z2m-wizard-external">
    <Heading title={`${T}.external.title`} text={`${T}.external.text`} />
    <ExternalField
      id="z2mWizardMqttUrl"
      field="mqttUrl"
      placeholder="mqtt://192.168.1.10:1883"
      label={`${T}.external.urlLabel`}
      view={view}
      actions={actions}
    />
    <div class="row">
      <div class="col-md-6">
        <ExternalField
          id="z2mWizardMqttUsername"
          field="mqttUsername"
          label={`${T}.external.usernameLabel`}
          view={view}
          actions={actions}
        />
      </div>
      <div class="col-md-6">
        <ExternalField
          id="z2mWizardMqttPassword"
          field="mqttPassword"
          type="password"
          label={`${T}.external.passwordLabel`}
          view={view}
          actions={actions}
        />
      </div>
    </div>
    <ExternalField
      id="z2mWizardFrontendUrl"
      field="z2mFrontendUrl"
      placeholder="http://192.168.1.10:8080"
      label={`${T}.external.frontendUrlLabel`}
      optional
      view={view}
      actions={actions}
    />
    <LinkButton onClick={actions.showAuto} dataCy="z2m-wizard-show-auto">
      <Text id={view.installable ? `${T}.key.backToUsb` : `${T}.key.back`} />
    </LinkButton>
  </div>
);

// Refused before anything was saved: the dongle is not plugged in, or an installation already runs
const SaveError = ({ view }) => {
  const { setupZigee2mqttStatus, setupZigee2mqttError } = view;
  if (setupZigee2mqttStatus === RequestStatus.ConflictError) {
    return (
      <div class="alert alert-warning" data-cy="z2m-wizard-save-conflict">
        <Text id="integration.zigbee2mqtt.setup.installation.alreadyRunning" />
      </div>
    );
  }
  if (setupZigee2mqttStatus === RequestStatus.Error) {
    return (
      <div class="alert alert-danger" data-cy="z2m-wizard-save-error">
        {setupZigee2mqttError === 'DONGLE_NOT_FOUND' ? (
          <Text id={`${T}.saveDongleNotFound`} />
        ) : (
          <Text id="integration.zigbee2mqtt.setup.saveError" />
        )}
      </div>
    );
  }
  return null;
};

// ① The dongle, or another way to get Zigbee2mqtt
const DesktopStepKey = ({ view, actions }) => {
  const { pane, installable, external } = view;
  const showFooter = installable || external;
  return (
    <div>
      {pane === PANE.AUTO && <Detected view={view} actions={actions} />}
      {pane === PANE.MANUAL && (
        <div data-cy="z2m-wizard-manual">
          <PortAndModel
            view={view}
            actions={actions}
            title={`${T}.key.manualTitle`}
            text={`${T}.key.manualText`}
            backToDetected
          />
        </div>
      )}
      {pane === PANE.NETWORK && <NetworkCoordinator view={view} actions={actions} />}
      {pane === PANE.EXTERNAL && <ExternalBroker view={view} actions={actions} />}
      <SaveError view={view} />
      {showFooter && (
        <div class={style.footer}>
          <div class={style.footerStatus}>
            {!external && (
              <PrefetchStatus configuration={view.configuration} zigbee2mqttStatus={view.zigbee2mqttStatus} />
            )}
          </div>
          <button
            type="button"
            class={cx('btn btn-primary', { 'btn-loading': view.saving })}
            onClick={actions.install}
            disabled={!view.configurationToSave || view.saving}
            data-cy="z2m-wizard-install"
          >
            <Text id={external ? `${T}.connect` : `${T}.install`} />
            <i class="fe fe-arrow-right ml-2" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
};

export default DesktopStepKey;
