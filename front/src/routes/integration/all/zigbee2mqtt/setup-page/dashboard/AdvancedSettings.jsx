import { Component } from 'preact';
import { Text } from 'preact-i18n';
import cx from 'classnames';

import { RequestStatus } from '../../../../../../utils/consts';
import MqttExternalCredentials from '../local/MqttExternalCredentials';
import SetupRemoteOptions from '../remote/SetupRemoteOptions';
import { isExternal } from './dashboardState';
import style from './dashboard.css';

const T = 'integration.zigbee2mqtt.setup.dashboard';

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

// The rare settings, on a screen of their own: the interface of Zigbee2mqtt, the MQTT access for other applications,
// the state of each component, the broker of an external Zigbee2mqtt, and the reset of the integration
class AdvancedSettings extends Component {
  updatePort = e => this.setState({ port: e.target.value });

  savePort = () => this.props.actions.savePort(this.state.port);

  showConfirmReset = () => this.setState({ confirmReset: true });

  cancelReset = () => this.setState({ confirmReset: false });

  constructor(props) {
    super(props);
    this.state = { port: props.view.configuration.z2mTcpPort || '', confirmReset: false };
  }

  render({ view, actions }, { port, confirmReset }) {
    const { configuration, status, z2mUrl, saving, resetZigbee2mqttStatus } = view;
    const external = isExternal(configuration);
    const portChanged = `${port}` !== `${configuration.z2mTcpPort || ''}`;
    const validPort = /^\d+$/.test(`${port}`) && Number(port) >= 1 && Number(port) <= 65535;
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
                  saveConfiguration={actions.saveBroker}
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
