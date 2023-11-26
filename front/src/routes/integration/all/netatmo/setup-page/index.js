import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { route } from 'preact-router';
import SetupTab from './SetupTab';
import NetatmoPage from '../NetatmoPage';
import withIntlAsProp from '../../../../../utils/withIntlAsProp';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../../server/utils/constants';
import { STATUS } from '../../../../../../../server/services/netatmo/lib/utils/netatmo.constants';


class NetatmoSetupPage extends Component {

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
      if (this.props.error === "access_denied") {
        console.error('Close window in 10s', this.props.error)
        await this.setState({ accessDenied: true });
        setTimeout(() => {
          route('/dashboard/integration/device/netatmo/setup');
          // window.close();
        }, 5000);
      } else {
        console.error('Close window in 60s', this.props)
        await this.setState({ errorCloseWindow: true });
        setTimeout(() => {
          route('/dashboard/integration/device/netatmo/setup');
        }, 60000);
      }

      await this.setState({ netatmoConnected: STATUS.DISCONNECTED});
    }
    if (this.props.code) {
      let successfulNewToken = false;
      try {
        await this.setState({ netatmoConnected: STATUS.PROCESSING_TOKEN, errored: false });
        const response = await this.props.httpClient.post('/api/v1/service/netatmo/getAccessToken', {
          codeOAuth: this.props.code,
          redirectUri: this.state.redirectUriNetatmoSetup,
          state: this.props.state
        });
        console.log('response', response);
        console.log(response);
        if (response) successfulNewToken = true;
        await this.props.httpClient.post('/api/v1/service/netatmo/variable/NETATMO_CONNECTED', {
          value: successfulNewToken
        });
        route('/dashboard/integration/device/netatmo/setup'); // -> Page success
        this.setState({ netatmoConnected: STATUS.CONNECTED });
        // setTimeout(() => {
        //   window.close();
        // }, 5000);

      } catch (e) {
        console.error(e);
        await this.setState({ netatmoConnected: STATUS.DISCONNECTED, errored: true });
        route('/dashboard/integration/device/netatmo/setup'); // -> Page error
      }
    }
  };

  getConnectedState = async () => {
    let netatmoConnected = STATUS.CONNECTING;

    this.setState({
      netatmoConnected,
    });
    try {
      const { value: connectedState } = await this.props.httpClient.get('/api/v1/service/netatmo/variable/NETATMO_CONNECTED');
      if (connectedState == true) netatmoConnected = STATUS.CONNECTED; else netatmoConnected = STATUS.DISCONNECTED;
      this.setState({
        netatmoConnected,
      });
    } catch (e) {
      console.log(e)
      this.setState({
        netatmoConnected: STATUS.NOT_INITIALIZED,
      });
    }
  };

  init = async () => {
    await this.setState({ loading: true, errorCloseWindow: false });
    await Promise.all([this.getSessionGatewayClient(), this.detectCode(), this.getConnectedState()]);
    await this.setState({ loading: false });
  };
  componentDidMount() {
    this.init();
  }

  updateStatus = async (state, status) => {
    console.log('status', status)
    console.log('state', state)
    this.setState({
      netatmoConnected: state,
    });
  };

  componentWillMount() {
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.NETATMO.STATUS, this.updateStatus);
  }

  componentWillUnmount() {
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.NETATMO.STATUS, this.updateStatus);
  }

  render(props, { redirectUriNetatmoSetup, loading, errored, errorCloseWindow, accessDenied, notOnGladysGateway, netatmoConnected }) {

    return (
      <NetatmoPage user={props.user}  errored={errored} accessDenied={accessDenied} netatmoConnected={netatmoConnected} errorCloseWindow={errorCloseWindow}>
        <SetupTab
          {...props}
          redirectUriNetatmoSetup={redirectUriNetatmoSetup}
          loading={loading}
          notOnGladysGateway={notOnGladysGateway}
          netatmoConnected={netatmoConnected}
          errored={errored}
          errorCloseWindow={errorCloseWindow}
          accessDenied={accessDenied}
        />
      </NetatmoPage>
    );
  }
}

export default withIntlAsProp(connect('user,session,httpClient', {})(NetatmoSetupPage));
