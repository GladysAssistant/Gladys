import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';
import { connect } from 'unistore/preact';
import { Component } from 'preact';
import get from 'get-value';

import ZwaveJSUIPage from '../ZwaveJSUIPage';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../../server/utils/constants';

class DiscoverTab extends Component {
  showPasswordTimer = null;

  state = {
    loading: true,
    mqttUrl: '',
    mqttUsername: '',
    mqttPassword: ''
  };

  updateUrl = e => {
    this.setState({ mqttUrl: e.target.value });
  };

  updateUsername = e => {
    this.setState({ mqttUsername: e.target.value });
  };

  updatePassword = e => {
    this.setState({ mqttPassword: e.target.value });
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

  getStatus = async () => {
    try {
      const { configured, connected } = await this.props.httpClient.get(`/api/v1/service/zwavejs-ui/status`);
      await this.setState({ configured, connected });
    } catch (e) {
      console.error(e);
    }
  };

  getConfiguration = async () => {
    try {
      const config = await this.props.httpClient.get('/api/v1/service/zwavejs-ui/configuration');
      const mqttUrl = config.mqtt_url || '';
      const mqttUsername = config.mqtt_username || '';
      const mqttPassword = config.mqtt_password || '';
      await this.setState({ mqttUrl, mqttUsername, mqttPassword });
    } catch (e) {
      console.error(e);
    }
  };

  init = async () => {
    await this.setState({ loading: true });
    await this.getStatus();
    await this.getConfiguration();
    await this.setState({ loading: false });
  };

  saveConfiguration = async e => {
    e.preventDefault();
    const { mqttUrl, mqttUsername, mqttPassword } = this.state;
    try {
      await this.setState({ unknownError: null, unknownErrorStatus: null });
      await this.props.httpClient.post('/api/v1/service/zwavejs-ui/configuration', {
        mqtt_url: mqttUrl,
        mqtt_username: mqttUsername,
        mqtt_password: mqttPassword
      });
      await this.props.httpClient.post('/api/v1/service/zwavejs-ui/connect');
    } catch (e) {
      console.error(e);
      const status = get(e, 'response.status');
      const error = get(e, 'response.data.error');
      this.setState({ unknownError: JSON.stringify(error), unknownErrorStatus: status });
    }
  };

  componentDidMount() {
    this.init();
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.ZWAVEJS_UI.CONNECTED, this.getStatus);
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.ZWAVEJS_UI.ERROR, this.getStatus);
  }

  componentWillUnmount() {
    if (this.showPasswordTimer) {
      clearTimeout(this.showPasswordTimer);
      this.showPasswordTimer = null;
    }
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.ZWAVEJS_UI.CONNECTED, this.getStatus);
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.ZWAVEJS_UI.ERROR, this.getStatus);
  }

  render(
    props,
    {
      loading,
      configured,
      connected,
      unknownError,
      unknownErrorStatus,
      mqttUrl,
      mqttUsername,
      mqttPassword,
      showPassword
    }
  ) {
    return (
      <ZwaveJSUIPage user={props.user}>
        <div class="card">
          <div class="card-header">
            <h1 class="card-title">
              <Text id="integration.zwavejs-ui.setup.title" />
            </h1>
          </div>
          <div class="card-body">
            <div class="alert alert-warning">
              <Text id="integration.zwavejs-ui.alphaWarning" />
            </div>
            <div class="alert alert-secondary">
              <Text id="integration.zwavejs-ui.setup.description" />
            </div>

            <h4>
              <Text id="integration.zwavejs-ui.setup.zwaveJsUiConfigurationTitle" />
            </h4>
            <p>
              <Text id="integration.zwavejs-ui.setup.zwaveJsUiConfigurationMqttDescription" />
            </p>
            <img class="img-fluid mt-4 mb-4" src="/assets/integrations/zwavejs-ui/zwavejs-ui-mqtt-configuration.jpg" />
            <p>
              <Text id="integration.zwavejs-ui.setup.zwaveJsUiConfigurationGatewayDescription" />
            </p>
            <img
              class="img-fluid mt-4 mb-4"
              src="/assets/integrations/zwavejs-ui/zwavejs-ui-gateway-configuration.jpg"
            />

            <h4>
              <Text id="integration.zwavejs-ui.setup.mqttConfigurationTitle" />
            </h4>

            {configured && !connected && (
              <div class="alert alert-warning">
                <Text id="integration.zwavejs-ui.setup.notConnected" />
              </div>
            )}
            {connected && (
              <div class="alert alert-success">
                <Text id="integration.zwavejs-ui.setup.connected" />
              </div>
            )}
            {unknownError && (
              <div class="alert alert-danger">
                {unknownErrorStatus} {unknownError}
              </div>
            )}
            <div
              class={cx('dimmer', {
                active: loading
              })}
            >
              <div class="loader" />
              <div class={cx('dimmer-content')}>
                <form>
                  <div class="form-group">
                    <label for="mqttUrl" class="form-label">
                      <Text id={`integration.mqtt.setup.urlLabel`} />
                    </label>
                    <Localizer>
                      <input
                        id="mqttUrl"
                        name="mqttUrl"
                        placeholder={<Text id="integration.zwavejs-ui.setup.urlPlaceholder" />}
                        value={mqttUrl}
                        class="form-control"
                        onInput={this.updateUrl}
                      />
                    </Localizer>
                  </div>

                  <div class="form-group">
                    <label for="mqttUsername" class="form-label">
                      <Text id={`integration.zwavejs-ui.setup.userLabel`} />
                    </label>
                    <Localizer>
                      <input
                        id="mqttUsername"
                        name="mqttUsername"
                        placeholder={<Text id="integration.zwavejs-ui.setup.userPlaceholder" />}
                        value={mqttUsername}
                        class="form-control"
                        onInput={this.updateUsername}
                        autocomplete="off"
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
                          placeholder={<Text id="integration.zwavejs-ui.setup.passwordPlaceholder" />}
                          value={mqttPassword}
                          class="form-control"
                          onInput={this.updatePassword}
                          autocomplete="off"
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
                    <button type="submit" class="btn btn-success" onClick={this.saveConfiguration}>
                      <Text id="integration.zwavejs-ui.setup.saveLabel" />
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </ZwaveJSUIPage>
    );
  }
}

export default connect('httpClient,user,session', {})(DiscoverTab);
