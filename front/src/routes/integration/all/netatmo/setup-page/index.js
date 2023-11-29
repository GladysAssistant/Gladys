import { Component } from 'preact';
import { connect } from 'unistore/preact';
import SetupTab from './SetupTab';
import NetatmoPage from '../NetatmoPage';
import withIntlAsProp from '../../../../../utils/withIntlAsProp';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../../server/utils/constants';
import { STATUS } from '../../../../../../../server/services/netatmo/lib/utils/netatmo.constants';
import { RequestStatus } from '../../../../../utils/consts';

class NetatmoSetupPage extends Component {
  getRedirectUri = async () => {
    try {
      const { result } = await this.props.httpClient.post('/api/v1/service/netatmo/connect');
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
        this.props.httpClient.post('/api/v1/service/netatmo/saveStatus', {
          statusType: STATUS.ERROR.CONNECTING,
          message: this.props.error
        });
        setTimeout(() => {
          window.close();
        }, 500);
      } else {
        this.props.httpClient.post('/api/v1/service/netatmo/saveStatus', {
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
        await this.setState({ connectNetatmoStatus: STATUS.PROCESSING_TOKEN, errored: false });
        const response = await this.props.httpClient.post('/api/v1/service/netatmo/retrieveTokens', {
          codeOAuth: this.props.code,
          redirectUri: this.state.redirectUriNetatmoSetup,
          state: this.props.state
        });
        if (response) successfulNewToken = true;
        await this.props.httpClient.post('/api/v1/service/netatmo/variable/NETATMO_CONNECTED', {
          value: successfulNewToken
        });
        this.setState({ connectNetatmoStatus: STATUS.CONNECTED });
        setTimeout(() => {
          window.close();
        }, 500);
      } catch (e) {
        console.error(e);
        this.props.httpClient.post('/api/v1/service/netatmo/saveStatus', {
          statusType: STATUS.PROCESSING_TOKEN,
          message: 'other_error'
        });
        await this.setState({ connectNetatmoStatus: STATUS.DISCONNECTED, errored: true });
      }
    }
  };

  saveConfiguration = async e => {
    e.preventDefault();

    try {
      this.props.httpClient.post('/api/v1/service/netatmo/saveConfiguration', {
        username: this.state.netatmoUsername,
        clientId: this.state.netatmoClientId,
        clientSecret: this.state.netatmoClientSecret,
        scopeEnergy: this.state.netatmoScopesEnergy
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
        connectNetatmoStatus: STATUS.CONNECTING
      });
      // start service
      await this.getRedirectUri();
      const redirectUri = this.state.redirectUri;
      const regex = /dashboard|integration|device|netatmo|setup/;
      // // Open a new tab for authorization URL
      if (redirectUri && regex.test(this.state.redirectUri)) {
        window.open(this.state.redirectUri, '_blank'); //TODO à supprimer -> window.open(this.state.redirectUri, '_blank');window.location.href = this.state.redirectUri;
        await this.setState({
          netatmoSaveSettingsStatus: RequestStatus.Success
        });
      } else {
        console.error('Missing redirect URL');
        await this.setState({
          connectNetatmoStatus: STATUS.ERROR.CONNECTING
        });
      }
    } catch (e) {
      console.error('Error when redirecting to netatmo', e);

      await this.setState({
        connectNetatmoStatus: STATUS.ERROR.CONNECTING,
        errored: true
      });
    }
  };

  loadProps = async () => {
    let connectNetatmoStatus = STATUS.CONNECTING;
    let configuration = {};
    try {
      configuration = await this.props.httpClient.get('/api/v1/service/netatmo/config');
      if (Number(configuration.connected) === 1) connectNetatmoStatus = STATUS.CONNECTED;
      else connectNetatmoStatus = STATUS.DISCONNECTED;
    } catch (e) {
      console.error(e);
      await this.setState({ errored: true });
    } finally {
      await this.setState({
        netatmoUsername: configuration.username,
        netatmoClientId: configuration.clientId,
        netatmoClientSecret: configuration.clientSecret,
        connectNetatmoStatusState: configuration.connected,
        netatmoScopesEnergy: configuration.scopes.scopeEnergy,
        netatmoScopes: configuration.scopes,
        connectNetatmoStatus,
        clientSecretChanges: false
      });
    }
  };

  init = async () => {
    await this.setState({ loading: true, errored: false });
    await Promise.all([this.getSessionGatewayClient(), this.detectCode()]);
    await this.setState({ loading: false });
  };

  loadStatus = async () => {
    try {
      const netatmoStatus = await this.props.httpClient.get('/api/v1/service/netatmo/status');
      this.setState({
        netatmoConnected: netatmoStatus.connected
      });
    } catch (e) {
      this.setState({
        netatmoConnectionError: RequestStatus.NetworkError,
        errored: true
      });
      console.error(e);
    }
  };

  updateStatus = async state => {
    this.setState({
      connectNetatmoStatus: state.status
    });
  };

  updateStatusError = async state => {
    switch (state.statusType) {
      case STATUS.CONNECTING:
        if (state.status !== 'other_error') {
          await this.setState({});
          this.setState({
            connectNetatmoStatus: STATUS.DISCONNECTED,
            accessDenied: true,
            messageAlert: state.status
          });
        } else {
          this.setState({
            connectNetatmoStatus: STATUS.DISCONNECTED,
            errored: true
          });
        }
        break;
      case STATUS.PROCESSING_TOKEN:
        this.setState({
          connectNetatmoStatus: state.status
        });
        break;
    }
  };

  handleStateUpdateFromChild = newState => {
    this.setState(newState);
  };

  componentDidMount() {
    this.init();
    this.loadProps();
    // this.loadStatus();
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
      <NetatmoPage {...props} state={state} updateStateInIndex={this.handleStateUpdateFromChild}>
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
