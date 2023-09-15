import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import { RequestStatus } from '../../../../../utils/consts';
import cx from 'classnames';

class SetupForm extends Component {
  showPasswordTimer = null;

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

  componentWillUnmount() {
    if (this.showPasswordTimer) {
      clearTimeout(this.showPasswordTimer);
      this.showPasswordTimer = null;
    }
  }

  render(props, { showPassword }) {
    const gladysNotAvailable = props.mqttConnectionError === RequestStatus.NetworkError;
    return (
      <form>
        <div class="form-group">
          <label for="mqttUrl" class="form-label">
            <Text id={`integration.mqtt.setup.urlLabel`} />
          </label>
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
        </div>

        <div class="form-group">
          <label for="mqttUsername" class="form-label">
            <Text id={`integration.mqtt.setup.userLabel`} />
          </label>
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
        </div>

        <div class="form-group">
          <label for="mqttPassword" class="form-label">
            <Text id={`integration.mqtt.setup.passwordLabel`} />
          </label>
          <div class="input-icon mb-3">
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
