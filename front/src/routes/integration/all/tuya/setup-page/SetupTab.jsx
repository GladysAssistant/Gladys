import { Text, Localizer, MarkupText } from 'preact-i18n';
import cx from 'classnames';

import { RequestStatus } from '../../../../../utils/consts';
import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../../server/utils/constants';

class SetupTab extends Component {
  constructor(props) {
    super(props);
    this.state = {
      tuyaConnectionStatus: null,
      tuyaConnectionError: null,
      tuyaConnected: false,
      tuyaConnecting: false,
      showClientSecret: false
    };
  }

  componentWillMount() {
    this.getTuyaConfiguration();
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.TUYA.STATUS, this.updateConnectionStatus);
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.TUYA.ERROR, this.displayConnectionError);
  }

  componentWillUnmount() {
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.TUYA.STATUS, this.updateConnectionStatus);
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.TUYA.ERROR, this.displayConnectionError);
  }

  async getTuyaConfiguration() {
    let tuyaEndpoint = '';
    let tuyaAccessKey = '';
    let tuyaSecretKey = '';
    let tuyaAppAccountId = '';
    let tuyaAppUsername = '';

    this.setState({
      tuyaGetSettingsStatus: RequestStatus.Getting,
      tuyaEndpoint,
      tuyaAccessKey,
      tuyaSecretKey,
      tuyaAppAccountId,
      tuyaAppUsername
    });
    try {
      const { value: endpoint } = await this.props.httpClient.get('/api/v1/service/tuya/variable/TUYA_ENDPOINT');
      tuyaEndpoint = endpoint;

      const { value: accessKey } = await this.props.httpClient.get('/api/v1/service/tuya/variable/TUYA_ACCESS_KEY');
      tuyaAccessKey = accessKey;

      const { value: secretKey } = await this.props.httpClient.get('/api/v1/service/tuya/variable/TUYA_SECRET_KEY');
      tuyaSecretKey = secretKey;

      const { value: appAccountId } = await this.props.httpClient.get(
        '/api/v1/service/tuya/variable/TUYA_APP_ACCOUNT_UID'
      );
      tuyaAppAccountId = appAccountId;

      const { value: appUsername } = await this.props.httpClient.get('/api/v1/service/tuya/variable/TUYA_APP_USERNAME');
      tuyaAppUsername = appUsername;

      this.setState({
        tuyaGetSettingsStatus: RequestStatus.Success,
        tuyaEndpoint,
        tuyaAccessKey,
        tuyaSecretKey,
        tuyaAppAccountId,
        tuyaAppUsername
      });
    } catch (e) {
      this.setState({
        tuyaGetSettingsStatus: RequestStatus.Error
      });
    }
  }

  saveTuyaConfiguration = async e => {
    e.preventDefault();
    this.setState({
      tuyaSaveSettingsStatus: RequestStatus.Getting,
      tuyaConnectionStatus: null,
      tuyaConnectionError: null,
      tuyaConnected: false,
      tuyaConnecting: false
    });
    try {
      await this.props.httpClient.post('/api/v1/service/tuya/variable/TUYA_ENDPOINT', {
        value: this.state.tuyaEndpoint
      });

      await this.props.httpClient.post('/api/v1/service/tuya/variable/TUYA_ACCESS_KEY', {
        value: this.state.tuyaAccessKey.trim()
      });

      await this.props.httpClient.post('/api/v1/service/tuya/variable/TUYA_SECRET_KEY', {
        value: this.state.tuyaSecretKey.trim()
      });

      await this.props.httpClient.post('/api/v1/service/tuya/variable/TUYA_APP_ACCOUNT_UID', {
        value: this.state.tuyaAppAccountId.trim()
      });

      await this.props.httpClient.post('/api/v1/service/tuya/variable/TUYA_APP_USERNAME', {
        value: this.state.tuyaAppUsername.trim()
      });

      // start service
      const service = await this.props.httpClient.post('/api/v1/service/tuya/start');
      if (service && service.status === 'ERROR') {
        throw new Error('TUYA_START_ERROR');
      }
      this.setState({
        tuyaSaveSettingsStatus: RequestStatus.Success
      });
    } catch (e) {
      const responseMessage =
        (e && e.response && e.response.data && e.response.data.message) ||
        (e && e.message && e.message !== 'TUYA_START_ERROR' ? e.message : null);
      this.setState({
        tuyaSaveSettingsStatus: RequestStatus.Error,
        tuyaConnectionError: responseMessage
      });
    }
  };

  updateConnectionStatus = event => {
    const status = event && event.status;
    const error = event && event.error;
    if (status === 'connecting') {
      this.setState({
        tuyaConnectionStatus: RequestStatus.Success,
        tuyaConnecting: true,
        tuyaConnected: false
      });
      return;
    }
    if (status === 'connected') {
      this.setState({
        tuyaConnectionStatus: RequestStatus.Success,
        tuyaConnectionError: null,
        tuyaConnecting: false,
        tuyaConnected: true
      });
      return;
    }
    if (status === 'error') {
      this.setState({
        tuyaConnectionStatus: RequestStatus.Error,
        tuyaConnecting: false,
        tuyaConnected: false,
        tuyaConnectionError: error || this.state.tuyaConnectionError
      });
    }
  };

  displayConnectionError = error => {
    const message = (error && error.message) || (error && error.payload && error.payload.message);
    this.setState({
      tuyaConnectionStatus: RequestStatus.Error,
      tuyaConnectionError: message || 'unknown',
      tuyaConnecting: false,
      tuyaConnected: false
    });
  };

  updateConfiguration = e => {
    this.setState({
      [e.target.name]: e.target.value
    });
  };

  toggleClientSecret = () => {
    this.setState({
      showClientSecret: !this.state.showClientSecret
    });
  };

  render(props, state) {
    return (
      <div class="card">
        <div class="card-header">
          <h1 class="card-title">
            <Text id="integration.tuya.setup.title" />
          </h1>
        </div>
        <div class="card-body">
          <div
            class={cx('dimmer', {
              active: state.tuyaSaveSettingsStatus === RequestStatus.Getting
            })}
          >
            <div class="loader" />
            <div class="dimmer-content">
              {state.tuyaSaveSettingsStatus === RequestStatus.Error && (
                <div class="alert alert-danger">
                  <Text id="integration.tuya.setup.error" />
                  {state.tuyaConnectionError && !state.tuyaConnecting && !state.tuyaConnected && (
                    <div class="mt-2">
                      <code>{state.tuyaConnectionError}</code>
                    </div>
                  )}
                </div>
              )}
              {state.tuyaConnecting && (
                <p class="alert alert-info">
                  <Text id="integration.tuya.setup.connecting" />
                </p>
              )}
              {state.tuyaConnected && (
                <p class="alert alert-success">
                  <Text id="integration.tuya.setup.connected" />
                </p>
              )}
              {state.tuyaConnectionStatus === RequestStatus.Error && (
                <div class="alert alert-danger">
                  <Text id="integration.tuya.setup.connectionError" />
                  {state.tuyaConnectionError && (
                    <div class="mt-2">
                      <code>{state.tuyaConnectionError}</code>
                    </div>
                  )}
                </div>
              )}
              <p>
                <MarkupText id="integration.tuya.setup.cloudTitle" />
                <MarkupText id="integration.tuya.setup.description" />
                <MarkupText id="integration.tuya.setup.descriptionCreateAccount" />
                <MarkupText id="integration.tuya.setup.descriptionCreateProject" />
                <MarkupText id="integration.tuya.setup.descriptionGetKeys" />
                <MarkupText id="integration.tuya.setup.descriptionGetAppAccountUid" />
                <MarkupText id="integration.tuya.setup.descriptionGetAppAccountUid2" />
                <MarkupText id="integration.tuya.setup.descriptionTrial" />
                <MarkupText id="integration.tuya.setup.localTitle" />
                <MarkupText id="integration.tuya.setup.descriptionLocalMode" />
                <MarkupText id="integration.tuya.setup.limitationsTitle" />
                <MarkupText id="integration.tuya.setup.limitationsProtocol35" />
              </p>

              <form>
                <div class="form-group">
                  <label for="tuyaEndpoint" class="form-label">
                    <Text id={`integration.tuya.setup.endpoint`} />
                  </label>
                  <select
                    className="form-control"
                    name="tuyaEndpoint"
                    value={state.tuyaEndpoint}
                    onChange={this.updateConfiguration}
                  >
                    <option value="china">
                      <Text id="integration.tuya.setup.endpoints.china" />
                    </option>
                    <option value="westernAmerica">
                      <Text id="integration.tuya.setup.endpoints.westernAmerica" />
                    </option>
                    <option value="easternAmerica">
                      <Text id="integration.tuya.setup.endpoints.easternAmerica" />
                    </option>
                    <option value="centralEurope">
                      <Text id="integration.tuya.setup.endpoints.centralEurope" />
                    </option>
                    <option value="westernEurope">
                      <Text id="integration.tuya.setup.endpoints.westernEurope" />
                    </option>
                    <option value="india">
                      <Text id="integration.tuya.setup.endpoints.india" />
                    </option>
                  </select>
                </div>

                <div class="form-group">
                  <label for="tuyaAccessKey" class="form-label">
                    <Text id={`integration.tuya.setup.accessKey`} />
                  </label>
                  <Localizer>
                    <input
                      name="tuyaAccessKey"
                      type="text"
                      placeholder={<Text id="integration.tuya.setup.accessKeyPlaceholder" />}
                      value={state.tuyaAccessKey}
                      class="form-control"
                      onInput={this.updateConfiguration}
                    />
                  </Localizer>
                </div>

                <div class="form-group">
                  <label htmlFor="tuyaSecretKey" className="form-label">
                    <Text id={`integration.tuya.setup.secretKey`} />
                  </label>
                  <div class="input-icon mb-3">
                    <Localizer>
                      <input
                        name="tuyaSecretKey"
                        type={state.showClientSecret ? 'text' : 'password'}
                        placeholder={<Text id="integration.tuya.setup.secretKeyPlaceholder" />}
                        value={state.tuyaSecretKey}
                        className="form-control"
                        autocomplete="off"
                        onInput={this.updateConfiguration}
                      />
                    </Localizer>
                    <span class="input-icon-addon cursor-pointer" onClick={this.toggleClientSecret}>
                      <i
                        class={cx('fe', {
                          'fe-eye': !state.showClientSecret,
                          'fe-eye-off': state.showClientSecret
                        })}
                      />
                    </span>
                  </div>
                </div>

                <div class="form-group">
                  <label htmlFor="tuyaAppAccountId" className="form-label">
                    <Text id={`integration.tuya.setup.appAccountId`} />
                  </label>
                  <Localizer>
                    <input
                      name="tuyaAppAccountId"
                      type="text"
                      placeholder={<Text id="integration.tuya.setup.appAccountIdPlaceholder" />}
                      value={state.tuyaAppAccountId}
                      className="form-control"
                      onInput={this.updateConfiguration}
                    />
                  </Localizer>
                </div>

                <div class="form-group">
                  <label htmlFor="tuyaAppUsername" className="form-label">
                    <Text id={`integration.tuya.setup.appUsername`} />
                  </label>
                  <Localizer>
                    <input
                      name="tuyaAppUsername"
                      type="text"
                      placeholder={<Text id="integration.tuya.setup.appUsernamePlaceholder" />}
                      value={state.tuyaAppUsername}
                      className="form-control"
                      onInput={this.updateConfiguration}
                    />
                  </Localizer>
                </div>

                <div class="row mt-5">
                  <div class="col">
                    <button type="submit" class="btn btn-success" onClick={this.saveTuyaConfiguration}>
                      <Text id="integration.tuya.setup.saveLabel" />
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default connect('httpClient,session', {})(SetupTab);
