import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import { RequestStatus } from '../../../../../utils/consts';
import cx from 'classnames';

class SetupForm extends Component {
  showPasswordTimer = null;
  copyTimer = null;

  updateUrl = e => {
    this.props.updateConfiguration({ mqttUrl: e.target.value });
  };

  updateUsername = e => {
    this.props.updateConfiguration({ mqttUsername: e.target.value });
  };

  updatePassword = e => {
    this.props.updateConfiguration({ mqttPassword: e.target.value, passwordChanges: true });
  };

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

  copyValue = async (fieldId, value) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(value);
      this.setState({ copiedField: fieldId });
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

  renderCopyButton = (fieldId, value, dataCy) => {
    const canCopy = typeof window !== 'undefined' && window.isSecureContext;

    if (!canCopy || !value) {
      return null;
    }

    return (
      <span class="input-group-append">
        <button
          type="button"
          class="btn btn-outline-secondary"
          onClick={() => this.copyValue(fieldId, value)}
          data-cy={dataCy}
        >
          <i class="fe fe-copy" />
        </button>
      </span>
    );
  };

  renderCopiedFeedback = fieldId => {
    const canCopy = typeof window !== 'undefined' && window.isSecureContext;

    if (!canCopy || this.state.copiedField !== fieldId) {
      return null;
    }

    return (
      <small class="text-success d-block mt-1">
        <Text id="integration.mqtt.feature.copied" />
      </small>
    );
  };

  render(props, { showPassword }) {
    const gladysNotAvailable = props.mqttConnectionError === RequestStatus.NetworkError;
    return (
      <form>
        <div class="form-group">
          <label for="mqttUrl" class="form-label">
            <Text id={`integration.mqtt.setup.urlLabel`} />
          </label>
          <div class="input-group">
            <Localizer>
              <input
                id="mqttUrl"
                name="mqttUrl"
                placeholder={<Text id="integration.mqtt.setup.urlPlaceholder" />}
                value={props.mqttUrl}
                class="form-control"
                onInput={this.updateUrl}
                disabled={props.useEmbeddedBroker || gladysNotAvailable}
              />
            </Localizer>
            {this.renderCopyButton('mqttUrl', props.mqttUrl, 'mqtt-setup-url-copy-button')}
          </div>
          {this.renderCopiedFeedback('mqttUrl')}
        </div>

        <div class="form-group">
          <label for="mqttUsername" class="form-label">
            <Text id={`integration.mqtt.setup.userLabel`} />
          </label>
          <div class="input-group">
            <Localizer>
              <input
                id="mqttUsername"
                name="mqttUsername"
                placeholder={<Text id="integration.mqtt.setup.userPlaceholder" />}
                value={props.mqttUsername}
                class="form-control"
                onInput={this.updateUsername}
                autocomplete="off"
                disabled={gladysNotAvailable}
              />
            </Localizer>
            {this.renderCopyButton('mqttUsername', props.mqttUsername, 'mqtt-setup-username-copy-button')}
          </div>
          {this.renderCopiedFeedback('mqttUsername')}
        </div>

        <div class="form-group">
          <label for="mqttPassword" class="form-label">
            <Text id={`integration.mqtt.setup.passwordLabel`} />
          </label>
          <div class="d-flex align-items-start flex-wrap" style="gap: 0.5rem;">
            <div class="input-icon mb-0 flex-grow-1" style="min-width: 0;">
              <Localizer>
                <input
                  id="mqttPassword"
                  name="mqttPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={<Text id="integration.mqtt.setup.passwordPlaceholder" />}
                  value={props.mqttPassword}
                  class="form-control"
                  onInput={this.updatePassword}
                  autocomplete="off"
                  disabled={gladysNotAvailable}
                />
              </Localizer>
              <span class="input-icon-addon cursor-pointer" onClick={this.togglePassword}>
                <i
                  class={cx('fe', {
                    'fe-eye': !showPassword,
                    'fe-eye-off': showPassword
                  })}
                />
              </span>
            </div>
            {typeof window !== 'undefined' && window.isSecureContext && props.mqttPassword && (
              <button
                type="button"
                class="btn btn-outline-secondary"
                onClick={() => this.copyValue('mqttPassword', props.mqttPassword)}
                data-cy="mqtt-setup-password-copy-button"
              >
                <i class="fe fe-copy" />
              </button>
            )}
          </div>
          {this.renderCopiedFeedback('mqttPassword')}
        </div>

        <div class="form-group">
          <button type="submit" class="btn btn-success" onClick={props.saveConfiguration} disabled={gladysNotAvailable}>
            <Text id="integration.mqtt.setup.saveLabel" />
          </button>
        </div>
      </form>
    );
  }
}

export default SetupForm;
