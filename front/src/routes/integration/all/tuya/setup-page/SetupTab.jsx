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
      tuyaConfigured: false,
      tuyaDisconnected: false,
      tuyaManuallyDisconnected: false,
      tuyaManualDisconnectJustDone: false,
      tuyaJustSaved: false,
      tuyaJustSavedMissing: false,
      tuyaDisconnecting: false,
      tuyaStatusLoading: false,
      showClientSecret: false
    };
  }

  componentDidMount() {
    this.getTuyaConfiguration();
    this.getTuyaStatus();
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
    const getVariable = async (name, fallback = '') => {
      try {
        const response = await this.props.httpClient.get(`/api/v1/service/tuya/variable/${name}`);
        return response && response.value ? response.value : fallback;
      } catch (e) {
        if (e && e.response && e.response.status === 404) {
          return fallback;
        }
        throw e;
      }
    };

    try {
      [tuyaEndpoint, tuyaAccessKey, tuyaSecretKey, tuyaAppAccountId, tuyaAppUsername] = await Promise.all([
        getVariable('TUYA_ENDPOINT'),
        getVariable('TUYA_ACCESS_KEY'),
        getVariable('TUYA_SECRET_KEY'),
        getVariable('TUYA_APP_ACCOUNT_UID'),
        getVariable('TUYA_APP_USERNAME')
      ]);

      this.setState({
        tuyaGetSettingsStatus: RequestStatus.Success,
        tuyaEndpoint,
        tuyaAccessKey,
        tuyaSecretKey,
        tuyaAppAccountId,
        tuyaAppUsername,
        tuyaConfigured: !!(tuyaEndpoint && tuyaAccessKey && tuyaSecretKey && tuyaAppAccountId)
      });
    } catch (e) {
      this.setState({
        tuyaGetSettingsStatus: RequestStatus.Error,
        tuyaEndpoint,
        tuyaAccessKey,
        tuyaSecretKey,
        tuyaAppAccountId,
        tuyaAppUsername,
        tuyaConfigured: !!(tuyaEndpoint && tuyaAccessKey && tuyaSecretKey && tuyaAppAccountId)
      });
    }
  }

  async getTuyaStatus() {
    this.setState({
      tuyaStatusLoading: true
    });
    try {
      const response = await this.props.httpClient.get('/api/v1/service/tuya/status');
      const status = response && response.status;
      const configured = response && response.configured;
      const manualDisconnect = response && response.manual_disconnect;
      const isConnected = status === 'connected';
      const isConnecting = status === 'connecting';
      const isError = status === 'error';
      const isManualDisconnect = !!manualDisconnect;
      const isUnexpectedDisconnect = isError && configured && !manualDisconnect;

      this.setState({
        tuyaStatusLoading: false,
        tuyaConfigured: !!configured,
        tuyaConnected: isManualDisconnect ? false : isConnected,
        tuyaConnecting: isManualDisconnect ? false : isConnecting,
        tuyaDisconnected: isUnexpectedDisconnect,
        tuyaManuallyDisconnected: isManualDisconnect,
        tuyaManualDisconnectJustDone: false,
        tuyaJustSaved: false,
        tuyaJustSavedMissing: false,
        tuyaConnectionStatus: isManualDisconnect ? null : isError ? RequestStatus.Error : null,
        tuyaConnectionError: isManualDisconnect ? null : isError ? response.error : null
      });
    } catch (e) {
      this.setState({
        tuyaStatusLoading: false
      });
    }
  }

  saveTuyaConfiguration = async e => {
    e.preventDefault();
    const tuyaEndpoint = (this.state.tuyaEndpoint || '').trim();
    const tuyaAccessKey = (this.state.tuyaAccessKey || '').trim();
    const tuyaSecretKey = (this.state.tuyaSecretKey || '').trim();
    const tuyaAppAccountId = (this.state.tuyaAppAccountId || '').trim();
    const tuyaAppUsername = (this.state.tuyaAppUsername || '').trim();

    this.setState({
      tuyaSaveSettingsStatus: RequestStatus.Getting,
      tuyaConnectionStatus: null,
      tuyaConnectionError: null,
      tuyaConnected: false,
      tuyaConnecting: false,
      tuyaDisconnected: false,
      tuyaManuallyDisconnected: false,
      tuyaManualDisconnectJustDone: false,
      tuyaJustSaved: true,
      tuyaJustSavedMissing: false
    });
    try {
      await this.props.httpClient.post('/api/v1/service/tuya/variable/TUYA_ENDPOINT', {
        value: tuyaEndpoint
      });

      await this.props.httpClient.post('/api/v1/service/tuya/variable/TUYA_ACCESS_KEY', {
        value: tuyaAccessKey
      });

      await this.props.httpClient.post('/api/v1/service/tuya/variable/TUYA_SECRET_KEY', {
        value: tuyaSecretKey
      });

      await this.props.httpClient.post('/api/v1/service/tuya/variable/TUYA_APP_ACCOUNT_UID', {
        value: tuyaAppAccountId
      });

      await this.props.httpClient.post('/api/v1/service/tuya/variable/TUYA_APP_USERNAME', {
        value: tuyaAppUsername
      });

      await this.props.httpClient.post('/api/v1/service/tuya/variable/TUYA_LAST_CONNECTED_CONFIG_HASH', {
        value: ''
      });

      await this.props.httpClient.post('/api/v1/service/tuya/variable/TUYA_MANUAL_DISCONNECT', {
        value: 'false'
      });

      const configured = !!(tuyaEndpoint && tuyaAccessKey && tuyaSecretKey && tuyaAppAccountId);
      if (!configured) {
        this.setState({
          tuyaSaveSettingsStatus: RequestStatus.Success,
          tuyaConfigured: false,
          tuyaDisconnected: true,
          tuyaJustSavedMissing: true,
          tuyaJustSaved: false
        });
        return;
      }

      // start service
      const service = await this.props.httpClient.post('/api/v1/service/tuya/start');
      if (service && service.status === 'ERROR') {
        throw new Error('TUYA_START_ERROR');
      }
      this.setState({
        tuyaSaveSettingsStatus: RequestStatus.Success,
        tuyaConfigured: true
      });
    } catch (e) {
      const responseMessage =
        (e && e.response && e.response.data && e.response.data.message) ||
        (e && e.message && e.message !== 'TUYA_START_ERROR' ? e.message : null);
      this.setState({
        tuyaSaveSettingsStatus: RequestStatus.Error,
        tuyaConnectionError: responseMessage,
        tuyaJustSaved: false,
        tuyaJustSavedMissing: false
      });
    }
  };

  updateConnectionStatus = event => {
    const status = event && event.status;
    const error = event && event.error;
    const manualDisconnect = event && event.manual_disconnect;
    if (status === 'connecting') {
      this.setState({
        tuyaConnectionStatus: RequestStatus.Success,
        tuyaConnecting: true,
        tuyaConnected: false,
        tuyaDisconnected: false,
        tuyaManuallyDisconnected: false,
        tuyaManualDisconnectJustDone: false,
        tuyaJustSavedMissing: false
      });
      return;
    }
    if (status === 'connected') {
      this.setState({
        tuyaConnectionStatus: RequestStatus.Success,
        tuyaConnectionError: null,
        tuyaConnecting: false,
        tuyaConnected: true,
        tuyaDisconnected: false,
        tuyaManuallyDisconnected: false,
        tuyaManualDisconnectJustDone: false,
        tuyaJustSavedMissing: false
      });
      return;
    }
    if (status === 'error') {
      this.setState({
        tuyaConnectionStatus: RequestStatus.Error,
        tuyaConnecting: false,
        tuyaConnected: false,
        tuyaDisconnected: this.state.tuyaConfigured && !manualDisconnect,
        tuyaManuallyDisconnected: false,
        tuyaManualDisconnectJustDone: false,
        tuyaJustSavedMissing: false,
        tuyaConnectionError: error || this.state.tuyaConnectionError
      });
      return;
    }
    if (status === 'not_initialized') {
      this.setState({
        tuyaConnectionStatus: null,
        tuyaConnecting: false,
        tuyaConnected: false,
        tuyaDisconnected: !manualDisconnect,
        tuyaManuallyDisconnected: !!manualDisconnect,
        tuyaManualDisconnectJustDone: manualDisconnect ? this.state.tuyaManualDisconnectJustDone : false,
        tuyaJustSavedMissing: false
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

  renderTuyaError = error => {
    if (!error) {
      return null;
    }
    if (typeof error === 'string' && error.startsWith('integration.tuya.setup.')) {
      return <Text id={error} />;
    }
    return <code>{error}</code>;
  };

  updateConfiguration = e => {
    const { name, value } = e.target;
    this.setState(prevState => {
      const nextState = { ...prevState, [name]: value };
      const tuyaEndpoint = (nextState.tuyaEndpoint || '').trim();
      const tuyaAccessKey = (nextState.tuyaAccessKey || '').trim();
      const tuyaSecretKey = (nextState.tuyaSecretKey || '').trim();
      const tuyaAppAccountId = (nextState.tuyaAppAccountId || '').trim();
      const configured = !!(tuyaEndpoint && tuyaAccessKey && tuyaSecretKey && tuyaAppAccountId);
      return {
        [name]: value,
        tuyaConfigured: configured
      };
    });
  };

  toggleClientSecret = () => {
    this.setState({
      showClientSecret: !this.state.showClientSecret
    });
  };

  disconnectFromCloud = async () => {
    this.setState({
      tuyaDisconnecting: true,
      tuyaConnectionError: null
    });
    try {
      await this.props.httpClient.post('/api/v1/service/tuya/disconnect');
      this.setState({
        tuyaDisconnecting: false,
        tuyaConnected: false,
        tuyaConnecting: false,
        tuyaDisconnected: false,
        tuyaManuallyDisconnected: true,
        tuyaManualDisconnectJustDone: true,
        tuyaConnectionStatus: null
      });
    } catch (e) {
      const responseMessage =
        (e && e.response && e.response.data && e.response.data.message) || (e && e.message) || 'unknown';
      this.setState({
        tuyaDisconnecting: false,
        tuyaConnectionStatus: RequestStatus.Error,
        tuyaConnectionError: responseMessage
      });
    }
  };

  render(props, state) {
    const showUnexpectedDisconnect = state.tuyaDisconnected && state.tuyaConfigured;
    const showConnectionError = state.tuyaConnectionStatus === RequestStatus.Error;
    const showCombinedDisconnectError = showUnexpectedDisconnect && showConnectionError;

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
                    <div class="mt-2">{this.renderTuyaError(state.tuyaConnectionError)}</div>
                  )}
                </div>
              )}
              {!state.tuyaConfigured && !state.tuyaStatusLoading && (
                <p class="alert alert-warning">
                  <Text id="integration.tuya.setup.notConfigured" />
                </p>
              )}
              {state.tuyaJustSavedMissing && (
                <p class="alert alert-danger">
                  <Text id="integration.tuya.setup.disconnectedMissingConfig" />
                </p>
              )}
              {state.tuyaConnecting && (
                <p class="alert alert-info">
                  <Text id="integration.tuya.setup.connecting" />
                </p>
              )}
              {state.tuyaConnected && (
                <p class="alert alert-success">
                  <Text
                    id={
                      state.tuyaJustSaved
                        ? 'integration.tuya.setup.connectedAfterSave'
                        : 'integration.tuya.setup.connectedStatus'
                    }
                  />
                </p>
              )}
              {state.tuyaManuallyDisconnected && (
                <p class="alert alert-info">
                  <Text
                    id={
                      state.tuyaManualDisconnectJustDone
                        ? 'integration.tuya.setup.disconnectSuccess'
                        : 'integration.tuya.setup.disconnectedManual'
                    }
                  />
                </p>
              )}
              {showCombinedDisconnectError && (
                <div class="alert alert-danger">
                  <MarkupText id="integration.tuya.setup.disconnectedUnexpected" />
                  <div class="mt-2">
                    <Text id="integration.tuya.setup.connectionError" />
                  </div>
                  {state.tuyaConnectionError && (
                    <div class="mt-2">{this.renderTuyaError(state.tuyaConnectionError)}</div>
                  )}
                </div>
              )}
              {showUnexpectedDisconnect && !showConnectionError && (
                <p class="alert alert-danger">
                  <MarkupText id="integration.tuya.setup.disconnectedUnexpected" />
                </p>
              )}
              {showConnectionError && !showUnexpectedDisconnect && (
                <div class="alert alert-danger">
                  <Text id="integration.tuya.setup.connectionError" />
                  {state.tuyaConnectionError && (
                    <div class="mt-2">{this.renderTuyaError(state.tuyaConnectionError)}</div>
                  )}
                </div>
              )}
              <div class="alert alert-info">
                <Text id="integration.tuya.localModeLimitInfo" />
              </div>
              <div>
                <MarkupText id="integration.tuya.setup.cloudTitle" />
                <MarkupText id="integration.tuya.setup.description" />
                <MarkupText id="integration.tuya.setup.descriptionCreateAccount" />
                <MarkupText id="integration.tuya.setup.descriptionCreateProject" />
                <MarkupText id="integration.tuya.setup.descriptionGetKeys" />
                <MarkupText id="integration.tuya.setup.descriptionGetAppAccountUid" />
                <MarkupText id="integration.tuya.setup.descriptionGetAppAccountUid2" />
                <MarkupText id="integration.tuya.setup.descriptionTrial" />
                <MarkupText id="integration.tuya.setup.descriptionCloudLimit" />
                <MarkupText id="integration.tuya.setup.descriptionControllable" />
                <MarkupText id="integration.tuya.setup.localTitle" />
                <MarkupText id="integration.tuya.setup.descriptionLocalMode" />
                <MarkupText id="integration.tuya.setup.descriptionLocalKeepsApp" />
                <MarkupText id="integration.tuya.setup.descriptionCameraLimit" />
              </div>

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
                  <div class="col-auto">
                    <button
                      type="button"
                      class="btn btn-outline-danger"
                      onClick={this.disconnectFromCloud}
                      disabled={!state.tuyaConfigured || state.tuyaDisconnecting || state.tuyaConnecting}
                    >
                      <Text id="integration.tuya.setup.disconnectLabel" />
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
