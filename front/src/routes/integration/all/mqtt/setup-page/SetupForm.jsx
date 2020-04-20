import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';

class SetupForm extends Component {
  updateUrl = e => {
    this.props.updateConfiguration({ mqttUrl: e.target.value });
  };

  updateUsername = e => {
    this.props.updateConfiguration({ mqttUsername: e.target.value });
  };

  updatePassword = e => {
    this.props.updateConfiguration({ mqttPassword: e.target.value, passwordChanges: true });
  };

  render(props) {
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
              disabled={props.useEmbeddedBroker}
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
              autoComplete="no"
            />
          </Localizer>
        </div>

        <div class="form-group">
          <label for="mqttPassword" class="form-label">
            <Text id={`integration.mqtt.setup.passwordLabel`} />
          </label>
          <Localizer>
            <input
              id="mqttPassword"
              name="mqttPassword"
              type="password"
              placeholder={<Text id="integration.mqtt.setup.passwordPlaceholder" />}
              value={props.mqttPassword}
              class="form-control"
              onInput={this.updatePassword}
              autoComplete="new-password"
            />
          </Localizer>
        </div>

        <div class="form-group">
          <button type="submit" class="btn btn-success" onClick={props.saveConfiguration}>
            <Text id="integration.mqtt.setup.saveLabel" />
          </button>
        </div>
      </form>
    );
  }
}

export default SetupForm;
