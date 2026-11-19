import { Component } from 'preact';
import { Text } from 'preact-i18n';
import cx from 'classnames';

import { RequestStatus } from '../../../../../../utils/consts';
import { MQTT_MODE } from '../constants';
import MqttExternalCredentials from '../local/MqttExternalCredentials';
import SetupRemoteOptions from '../remote/SetupRemoteOptions';
import { isExternal } from './dashboardState';
import AdvancedSettingsMobile from './AdvancedSettingsMobile';
import style from './dashboard.css';

const T = 'integration.zigbee2mqtt.setup.dashboard';
const BROKER_KEYS = ['mqttUrl', 'mqttUsername', 'mqttPassword', 'z2mFrontendUrl'];

const isValidPort = port => /^\d+$/.test(`${port}`) && Number(port) >= 1 && Number(port) <= 65535;

const ComponentRow = ({ name, ok, okText, koText }) => (
  <div class={style.fact} data-cy={`z2m-dashboard-component-${name}`}>
    <span class={style.factName}>
      <Text id={`${T}.advanced.components.${name}`} />
    </span>
    <span class={cx(style.componentState, ok ? style.componentOk : style.componentKo)}>
      <span class={style.componentDot} aria-hidden="true" />
      <Text id={`${T}.advanced.components.${ok ? okText : koText}`} />
    </span>
  </div>
);

// What a refused save says on a phone, in the bottom bar
const getSaveErrorText = view => {
  if (view.setupZigee2mqttStatus === RequestStatus.ConflictError) {
    return <Text id="integration.zigbee2mqtt.setup.installation.alreadyRunning" />;
  }
  if (view.setupZigee2mqttStatus === RequestStatus.Error) {
    return (
      <Text
        id={`${T}.advanced.${view.setupZigee2mqttError === 'DONGLE_NOT_FOUND' ? 'saveDongleNotFound' : 'saveError'}`}
      />
    );
  }
  return null;
};

// Refused before anything was saved: an installation already runs, the dongle is not plugged in, or another error
const SaveError = ({ view }) => {
  if (view.setupZigee2mqttStatus === RequestStatus.ConflictError) {
    return (
      <div class="alert alert-warning" data-cy="z2m-dashboard-save-conflict">
        <Text id="integration.zigbee2mqtt.setup.installation.alreadyRunning" />
      </div>
    );
  }
  if (view.setupZigee2mqttStatus === RequestStatus.Error) {
    return (
      <div class="alert alert-danger" data-cy="z2m-dashboard-save-error">
        <Text
          id={`${T}.advanced.${view.setupZigee2mqttError === 'DONGLE_NOT_FOUND' ? 'saveDongleNotFound' : 'saveError'}`}
        />
      </div>
    );
  }
  return null;
};

// The rare settings, on a screen of their own: the interface of Zigbee2mqtt, the MQTT access for other applications,
// the state of each component, the broker of an external Zigbee2mqtt, and the reset of the integration
class AdvancedSettings extends Component {
  updatePort = e => this.setState({ port: e.target.value });

  savePort = () => {
    this.setState({ saveRequested: true });
    this.props.actions.savePort(this.state.port);
  };

  saveBroker = configuration => {
    this.setState({ saveRequested: true });
    this.props.actions.saveBroker(configuration);
  };

  showConfirmReset = () => this.setState({ confirmReset: true });

  cancelReset = () => this.setState({ confirmReset: false });

  // The phone layout: the broker of an external Zigbee2mqtt edited in fields of the kit, saved from the bottom bar,
  // and a leave guard while something is not saved (docs/specs/zigbee2mqtt-installation.md, N.5)
  updateBroker = (field, value) => this.setState(prevState => ({ broker: { ...prevState.broker, [field]: value } }));

  isDirty = () => {
    const { configuration } = this.props.view;
    if (isExternal(configuration)) {
      return BROKER_KEYS.some(key => (this.state.broker[key] || '') !== (configuration[key] || ''));
    }
    return `${this.state.port}` !== `${configuration.z2mTcpPort || ''}`;
  };

  canSave = () => {
    const { view } = this.props;
    if (view.saving || view.installing) {
      return false;
    }
    if (isExternal(view.configuration)) {
      return Boolean((this.state.broker.mqttUrl || '').trim());
    }
    return isValidPort(this.state.port);
  };

  save = () => {
    if (isExternal(this.props.view.configuration)) {
      this.saveBroker({ ...this.state.broker, mqttMode: MQTT_MODE.EXTERNAL });
    } else {
      this.savePort();
    }
  };

  closeSaveError = () => this.setState({ saveRequested: false });

  openLeave = () => this.setState({ leaveOpen: true });

  closeLeave = () => this.setState({ leaveOpen: false });

  back = () => (this.isDirty() ? this.openLeave() : this.props.actions.showMain());

  saveAndLeave = () => {
    this.closeLeave();
    this.save();
  };

  leaveWithoutSaving = () => this.props.actions.showMain();

  constructor(props) {
    super(props);
    const { configuration } = props.view;
    // Whether this screen saved: the outcome of a save made elsewhere (the wizard) is not told here
    this.state = {
      port: configuration.z2mTcpPort || '',
      broker: BROKER_KEYS.reduce((broker, key) => ({ ...broker, [key]: configuration[key] || '' }), {}),
      confirmReset: false,
      saveRequested: false,
      leaveOpen: false
    };
  }

  // Saved by the end of an installation: shown unless the user is typing another one
  showSavedPort = (previousPort, savedPort) => {
    if (`${this.state.port}` === previousPort) {
      this.setState({ port: savedPort });
    }
  };

  componentDidUpdate(previousProps) {
    const previousPort = `${previousProps.view.configuration.z2mTcpPort || ''}`;
    const savedPort = `${this.props.view.configuration.z2mTcpPort || ''}`;
    if (savedPort !== previousPort) {
      this.showSavedPort(previousPort, savedPort);
    }
  }

  render({ view, actions }, { port, confirmReset, saveRequested }) {
    const { configuration, status, z2mUrl, saving, resetZigbee2mqttStatus } = view;
    const external = isExternal(configuration);
    const portChanged = `${port}` !== `${configuration.z2mTcpPort || ''}`;
    const validPort = isValidPort(port);
    if (view.isMobile) {
      const form = {
        ...this.state,
        external,
        validPort,
        dirty: this.isDirty(),
        canSave: this.canSave(),
        saveError: saveRequested ? getSaveErrorText(view) : null,
        updatePort: this.updatePort,
        updateBroker: this.updateBroker,
        save: this.save,
        closeSaveError: this.closeSaveError,
        showConfirmReset: this.showConfirmReset,
        cancelReset: this.cancelReset,
        back: this.back,
        openLeave: this.openLeave,
        closeLeave: this.closeLeave,
        saveAndLeave: this.saveAndLeave,
        leaveWithoutSaving: this.leaveWithoutSaving
      };
      return <AdvancedSettingsMobile view={view} actions={actions} form={form} />;
    }
    return (
      <div class={style.advanced} data-cy="z2m-dashboard-advanced">
        <button
          type="button"
          class={cx('btn btn-link', style.back)}
          onClick={actions.showMain}
          data-cy="z2m-dashboard-back"
        >
          <i class="fe fe-arrow-left mr-1" aria-hidden="true" />
          <Text id="integration.zigbee2mqtt.setupTab" />
        </button>
        <h2 class={style.advancedTitle}>
          <Text id={`${T}.advanced.title`} />
        </h2>

        {saveRequested && <SaveError view={view} />}
        <div class={style.grid}>
          <div class={style.column}>
            {!external && (
              <section class={style.card} data-cy="z2m-dashboard-port">
                <h3 class={style.sectionTitle}>
                  <Text id={`${T}.advanced.interface.title`} />
                </h3>
                <label class="form-label" for="z2mDashboardPort">
                  <Text id={`${T}.advanced.interface.port`} />
                </label>
                <div class={style.portRow}>
                  <input
                    id="z2mDashboardPort"
                    type="number"
                    inputmode="numeric"
                    min="1"
                    max="65535"
                    class="form-control"
                    value={port}
                    onInput={this.updatePort}
                    data-cy="z2m-dashboard-port-input"
                  />
                  <button
                    type="button"
                    class={cx('btn btn-primary', { 'btn-loading': saving })}
                    disabled={!portChanged || !validPort || saving || view.installing}
                    onClick={this.savePort}
                    data-cy="z2m-dashboard-port-save"
                  >
                    <Text id="global.save" />
                  </button>
                </div>
                <small class="form-text text-muted">
                  <Text id={`${T}.advanced.interface.help`} />
                </small>
                {z2mUrl && (
                  <a href={z2mUrl} target="_blank" rel="noopener noreferrer" data-cy="z2m-dashboard-open-interface">
                    <Text id={`${T}.advanced.interface.open`} />
                    <i class="fe fe-external-link ml-1" aria-hidden="true" />
                  </a>
                )}
              </section>
            )}
            {external && (
              <section class={style.card} data-cy="z2m-dashboard-broker">
                <h3 class={style.sectionTitle}>
                  <Text id={`${T}.advanced.broker.title`} />
                </h3>
                <SetupRemoteOptions
                  configuration={configuration}
                  saveConfiguration={this.saveBroker}
                  resetConfiguration={actions.noop}
                  disabled={saving || view.installing}
                />
              </section>
            )}
            <section class={style.card} data-cy="z2m-dashboard-components">
              <h3 class={style.sectionTitle}>
                <Text id={`${T}.advanced.components.title`} />
              </h3>
              <div class={style.facts}>
                <ComponentRow name="gladys" ok={status.gladysConnected} okText="connected" koText="disconnected" />
                {!external && <ComponentRow name="broker" ok={status.mqttRunning} okText="running" koText="stopped" />}
                <ComponentRow name="zigbee2mqtt" ok={status.zigbee2mqttConnected} okText="answers" koText="silent" />
              </div>
            </section>
          </div>
          <div class={style.column}>
            {!external && (
              <section class={style.card} data-cy="z2m-dashboard-mqtt-access">
                <MqttExternalCredentials configuration={configuration} mqttRunning={status.mqttRunning} />
              </section>
            )}
            <section class={style.card} data-cy="z2m-dashboard-reset">
              <h3 class={style.sectionTitle}>
                <Text id={`${T}.advanced.reset.title`} />
              </h3>
              <p class="text-muted">
                <Text id={`${T}.advanced.reset.text`} />
              </p>
              {resetZigbee2mqttStatus === RequestStatus.Error && (
                <div class="alert alert-danger" data-cy="z2m-reset-error">
                  <Text id="integration.zigbee2mqtt.setup.reset.error" />
                </div>
              )}
              {resetZigbee2mqttStatus === RequestStatus.ConflictError && (
                <div class="alert alert-warning" data-cy="z2m-reset-conflict">
                  <Text id="integration.zigbee2mqtt.setup.installation.busy" />
                </div>
              )}
              {confirmReset ? (
                <div class={style.confirm} role="alertdialog" data-cy="z2m-dashboard-confirm-reset">
                  <span>
                    <Text id="integration.zigbee2mqtt.setup.reset.confirmMessage" />
                  </span>
                  <div class={style.buttons}>
                    <button
                      type="button"
                      class={cx('btn btn-danger', { 'btn-loading': resetZigbee2mqttStatus === RequestStatus.Getting })}
                      disabled={resetZigbee2mqttStatus === RequestStatus.Getting}
                      onClick={actions.reset}
                      data-cy="z2m-reset-confirm-button"
                    >
                      <Text id="integration.zigbee2mqtt.setup.reset.confirmButton" />
                    </button>
                    <button
                      type="button"
                      class="btn btn-link"
                      onClick={this.cancelReset}
                      data-cy="z2m-reset-cancel-button"
                    >
                      <Text id="integration.zigbee2mqtt.setup.reset.cancelButton" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  class="btn btn-outline-danger"
                  onClick={this.showConfirmReset}
                  disabled={view.installing}
                  data-cy="z2m-reset-button"
                >
                  <Text id="integration.zigbee2mqtt.setup.reset.button" />
                </button>
              )}
            </section>
          </div>
        </div>
      </div>
    );
  }
}

export default AdvancedSettings;
