import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { route } from 'preact-router';
import SetupTab from './SetupTab';
import NetatmoPage from '../NetatmoPage';
import withIntlAsProp from '../../../../../utils/withIntlAsProp';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../../server/utils/constants';
import { STATUS } from '../../../../../../../server/services/netatmo/lib/utils/netatmo.constants';
import { RequestStatus } from '../../../../../utils/consts';

class NetatmoSetupPage extends Component {
  getRedirectUri = async () => {
    try {
      const result = await this.props.httpClient.post('/api/v1/service/netatmo/connect');
      const redirectUri = `${result.authUrl}&redirect_uri=${encodeURIComponent(this.state.redirectUriNetatmoSetup)}`;
      await this.setState({
        redirectUri
      });
    } catch (e) {
      console.error(e);
      await this.setState({ errored: true });
    }
  };

  getSessionGatewayClient = async () => {
    if (!this.props.session.gatewayClient) {
      this.setState({
        notOnGladysGateway: true,
        redirectUriNetatmoSetup: `${window.location.origin}/dashboard/integration/device/netatmo/setup`
      });
    } else return;
  };

  detectCode = async () => {
    if (this.props.error) {
      if (this.props.error === 'access_denied' || this.props.error === 'invalid_client') {
        this.props.httpClient.post('/api/v1/service/netatmo/status', {
          statusType: STATUS.ERROR.CONNECTING,
          message: this.props.error
        });
        await this.setState({
          connectNetatmoStatus: STATUS.DISCONNECTED,
          connected: false,
          configured: true,
          accessDenied: true,
          messageAlert: this.props.error
        });
      } else {
        this.props.httpClient.post('/api/v1/service/netatmo/status', {
          statusType: STATUS.ERROR.CONNECTING,
          message: 'other_error'
        });
        await this.setState({
          accessDenied: true,
          messageAlert: 'other_error',
          errored: true
        });
        console.error('Logs error', this.props);
      }
    }
    if (this.props.code && this.props.state) {
      let successfulNewToken = false;
      try {
        await this.setState({
          connectNetatmoStatus: STATUS.PROCESSING_TOKEN,
          connected: false,
          configured: true,
          errored: false
        });
        const response = await this.props.httpClient.post('/api/v1/service/netatmo/token', {
          codeOAuth: this.props.code,
          redirectUri: this.state.redirectUriNetatmoSetup,
          state: this.props.state
        });
        if (response) successfulNewToken = true;
        await this.props.httpClient.post('/api/v1/service/netatmo/variable/NETATMO_CONNECTED', {
          value: successfulNewToken
        });
        await this.setState({
          connectNetatmoStatus: STATUS.CONNECTED,
          connected: true,
          configured: true,
          errored: false
        });
        await this.props.httpClient.get('/api/v1/service/netatmo/discover', { refresh: true });
        setTimeout(() => {
          route('/dashboard/integration/device/netatmo/setup', true);
        }, 100);
      } catch (e) {
        console.error(e);
        this.props.httpClient.post('/api/v1/service/netatmo/status', {
          statusType: STATUS.PROCESSING_TOKEN,
          message: 'other_error'
        });
        await this.setState({
          connectNetatmoStatus: STATUS.DISCONNECTED,
          connected: false,
          configured: true,
          errored: true
        });
      }
    }
  };

  saveConfiguration = async e => {
    e.preventDefault();

    try {
      this.props.httpClient.post('/api/v1/service/netatmo/configuration', {
        clientId: this.state.netatmoClientId,
        clientSecret: this.state.netatmoClientSecret,
        energyApi: this.state.netatmoEnergyApi,
        weatherApi: this.state.netatmoWeatherApi
      });
      await this.setState({
        netatmoSaveSettingsStatus: RequestStatus.Success
      });
    } catch (e) {
      await this.setState({
        netatmoSaveSettingsStatus: RequestStatus.Error,
        errored: true
      });
    }
    try {
      await this.setState({
        connectNetatmoStatus: STATUS.CONNECTING,
        connected: false,
        configured: true
      });
      await this.getRedirectUri();
      const redirectUri = this.state.redirectUri;
      const regex = /dashboard|integration|device|netatmo|setup/;
      if (redirectUri && regex.test(this.state.redirectUri)) {
        window.location.href = this.state.redirectUri;
        await this.setState({
          connectNetatmoStatus: RequestStatus.Success,
          connected: false,
          configured: true
        });
      } else {
        console.error('Missing redirect URL');
        await this.setState({
          connectNetatmoStatus: STATUS.ERROR.CONNECTING,
          connected: false
        });
      }
    } catch (e) {
      console.error('Error when redirecting to netatmo', e);

      await this.setState({
        connectNetatmoStatus: STATUS.ERROR.CONNECTING,
        connected: false,
        errored: true
      });
    }
  };

  loadProps = async () => {
    let configuration = {};
    try {
      configuration = await this.props.httpClient.get('/api/v1/service/netatmo/configuration');
    } catch (e) {
      console.error(e);
      await this.setState({ errored: true });
    } finally {
      await this.setState({
        netatmoClientId: configuration.clientId,
        netatmoClientSecret: configuration.clientSecret,
        netatmoEnergyApi: configuration.energyApi,
        netatmoWeatherApi: configuration.weatherApi,
        clientSecretChanges: false
      });
    }
  };

  loadStatus = async () => {
    try {
      const netatmoStatus = await this.props.httpClient.get('/api/v1/service/netatmo/status');
      await this.setState({
        connectNetatmoStatus: netatmoStatus.status,
        connected: netatmoStatus.connected,
        configured: netatmoStatus.configured
      });
    } catch (e) {
      await this.setState({
        netatmoConnectionError: RequestStatus.NetworkError,
        errored: true
      });
      console.error(e);
    }
  };

  init = async () => {
    await this.setState({ loading: true, errored: false });
    await Promise.all([this.getSessionGatewayClient(), this.detectCode()]);
    await this.setState({ loading: false });
  };

  updateStatus = async state => {
    let connected = false;
    let configured = false;
    if (
      state.status === STATUS.CONNECTED ||
      state.status === STATUS.GET_DEVICES_VALUES ||
      state.status === STATUS.DISCOVERING_DEVICES
    ) {
      connected = true;
      configured = true;
    } else if (state.status === STATUS.NOT_INITIALIZED) {
      connected = false;
      configured = false;
    } else {
      connected = false;
      configured = true;
    }
    await this.setState({
      connectNetatmoStatus: state.status,
      connected,
      configured
    });
  };

  updateStatusError = async state => {
    switch (state.statusType) {
      case STATUS.CONNECTING:
        if (state.status !== 'other_error') {
          this.setState({
            connectNetatmoStatus: STATUS.DISCONNECTED,
            connected: false,
            accessDenied: true,
            messageAlert: state.status
          });
        } else {
          this.setState({
            connectNetatmoStatus: STATUS.DISCONNECTED,
            connected: false,
            errored: true
          });
        }
        break;
      case STATUS.PROCESSING_TOKEN:
        if (state.status === 'get_access_token_fail') {
          this.setState({
            connectNetatmoStatus: STATUS.DISCONNECTED,
            connected: false,
            accessDenied: true,
            messageAlert: state.status
          });
        } else if (state.status === 'invalid_client') {
          this.setState({
            connectNetatmoStatus: STATUS.DISCONNECTED,
            connected: false,
            accessDenied: true,
            messageAlert: state.status
          });
        } else {
          this.setState({
            connectNetatmoStatus: STATUS.DISCONNECTED,
            connected: false,
            errored: true
          });
        }
        break;
    }
  };

  handleStateUpdateFromChild = newState => {
    this.setState(newState);
  };

  componentDidMount() {
    this.init();
    this.loadProps();
    this.loadStatus();
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.NETATMO.STATUS, this.updateStatus);
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.NETATMO.ERROR.CONNECTING, this.updateStatusError);
    this.props.session.dispatcher.addListener(
      WEBSOCKET_MESSAGE_TYPES.NETATMO.ERROR.PROCESSING_TOKEN,
      this.updateStatusError
    );
  }
  componentWillUnmount() {
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.NETATMO.STATUS, this.updateStatus);
    this.props.session.dispatcher.removeListener(
      WEBSOCKET_MESSAGE_TYPES.NETATMO.ERROR.CONNECTING,
      this.updateStatusError
    );
    this.props.session.dispatcher.removeListener(
      WEBSOCKET_MESSAGE_TYPES.NETATMO.ERROR.PROCESSING_TOKEN,
      this.updateStatusError
    );
  }

  render(props, state, { loading }) {
    return (
      <NetatmoPage {...props}>
        <SetupTab
          {...props}
          {...state}
          loading={loading}
          loadProps={this.loadProps}
          updateStateInIndex={this.handleStateUpdateFromChild}
          saveConfiguration={this.saveConfiguration}
        />
      </NetatmoPage>
    );
  }
}

export default withIntlAsProp(connect('user,session,httpClient', {})(NetatmoSetupPage));
