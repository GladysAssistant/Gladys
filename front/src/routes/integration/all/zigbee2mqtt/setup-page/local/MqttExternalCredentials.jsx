import { Component } from 'preact';
import { Text } from 'preact-i18n';
import cx from 'classnames';

const DEFAULT_MQTT_URL = 'mqtt://localhost:1884';
const DEFAULT_MQTT_USERNAME = 'gladys';

class MqttExternalCredentials extends Component {
  showPasswordTimer = null;

  togglePassword = () => {
    const { showPassword } = this.state;

    if (this.showPasswordTimer) {
      clearTimeout(this.showPasswordTimer);
      this.showPasswordTimer = null;
    }

    this.setState({ showPassword: !showPassword });

    if (!showPassword) {
      this.showPasswordTimer = setTimeout(() => this.setState({ showPassword: false }), 5000);
    }
  };

  copyValue = async value => {
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(value);
      this.setState({ copiedField: value });
      if (this.copyTimer) {
        clearTimeout(this.copyTimer);
      }
      this.copyTimer = setTimeout(() => this.setState({ copiedField: null }), 2000);
    }
  };

  componentWillUnmount() {
    if (this.showPasswordTimer) {
      clearTimeout(this.showPasswordTimer);
      this.showPasswordTimer = null;
    }
    if (this.copyTimer) {
      clearTimeout(this.copyTimer);
      this.copyTimer = null;
    }
  }

  renderCredentialRow = (labelId, value, dataCy, { secret = false, showPassword = false } = {}) => {
    const canCopy = typeof window !== 'undefined' && window.isSecureContext;

    return (
      <tr>
        <td class="pr-4 text-muted align-top">
          <Text id={labelId} />
        </td>
        <td>
          <div class="d-flex align-items-center flex-wrap" style="gap: 0.5rem;">
            {secret ? (
              <code data-cy={dataCy}>{showPassword ? value : '••••••••••••••••••••'}</code>
            ) : (
              <code data-cy={dataCy}>{value}</code>
            )}
            {secret && (
              <button type="button" class="btn btn-sm btn-outline-secondary py-0 px-2" onClick={this.togglePassword}>
                <i
                  class={cx('fe', {
                    'fe-eye': !showPassword,
                    'fe-eye-off': showPassword
                  })}
                />
              </button>
            )}
            {canCopy && (
              <button
                type="button"
                class="btn btn-sm btn-outline-secondary py-0 px-2"
                onClick={() => this.copyValue(value)}
                data-cy="z2m-setup-local-mqtt-copy-button"
              >
                <i class="fe fe-copy" />
              </button>
            )}
            {canCopy && this.state.copiedField === value && (
              <small class="text-success">
                <Text id="integration.zigbee2mqtt.setup.modes.local.externalMqtt.copied" />
              </small>
            )}
          </div>
        </td>
      </tr>
    );
  };

  render({ configuration = {}, mqttRunning }, { showPassword }) {
    const { mqttUrl, mqttUsername, mqttPassword } = configuration;
    const hasMqttCredentials = Boolean(mqttPassword);

    if (!hasMqttCredentials) {
      return (
        <div data-cy="z2m-mqtt-external-credentials-pending">
          <div class="form-label">
            <Text id="integration.zigbee2mqtt.setup.modes.local.externalMqtt.title" />
          </div>
          <small class="text-muted">
            <Text id="integration.zigbee2mqtt.setup.modes.local.externalMqtt.credentialsPending" />
          </small>
        </div>
      );
    }

    const brokerUrl = mqttUrl || DEFAULT_MQTT_URL;
    const username = mqttUsername || DEFAULT_MQTT_USERNAME;

    return (
      <div data-cy="z2m-mqtt-external-credentials">
        <div class="form-label">
          <Text id="integration.zigbee2mqtt.setup.modes.local.externalMqtt.title" />
        </div>
        <small class="form-text text-muted mb-3">
          <Text id="integration.zigbee2mqtt.setup.modes.local.externalMqtt.description" />
        </small>
        {!mqttRunning && (
          <div class="alert alert-warning py-2 mb-3">
            <small>
              <Text id="integration.zigbee2mqtt.setup.modes.local.externalMqtt.brokerNotRunning" />
            </small>
          </div>
        )}
        <div class="card bg-light border">
          <div class="card-body py-3">
            <table class="mb-0">
              <tbody>
                {this.renderCredentialRow(
                  'integration.mqtt.setup.urlLabel',
                  brokerUrl,
                  'z2m-setup-local-mqtt-url-summary'
                )}
                {this.renderCredentialRow(
                  'integration.mqtt.setup.userLabel',
                  username,
                  'z2m-setup-local-mqtt-username-summary'
                )}
                {this.renderCredentialRow(
                  'integration.mqtt.setup.passwordLabel',
                  mqttPassword,
                  'z2m-setup-local-mqtt-password-summary',
                  { secret: true, showPassword }
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }
}

export default MqttExternalCredentials;
