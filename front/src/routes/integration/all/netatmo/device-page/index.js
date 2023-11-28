import { Component } from 'preact';
import { connect } from 'unistore/preact';
import DeviceTab from './DeviceTab';
import NetatmoPage from '../NetatmoPage';
import { RequestStatus } from '../../../../../utils/consts';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../../server/utils/constants';
import { STATUS } from '../../../../../../../server/services/netatmo/lib/utils/netatmo.constants';

class DevicePage extends Component {

  getConnectedState = async () => {
    let connectNetatmoStatus = STATUS.CONNECTING;

    this.setState({
      connectNetatmoStatus,
    });
    try {
      const { value: connectedState } = await this.props.httpClient.get('/api/v1/service/netatmo/variable/NETATMO_CONNECTED');
      if (connectedState == true) connectNetatmoStatus = STATUS.CONNECTED; else connectNetatmoStatus = STATUS.DISCONNECTED;
      this.setState({
        connectNetatmoStatus,
      });
    } catch (e) {
      console.log(e)
      this.setState({
        connectNetatmoStatus: STATUS.NOT_INITIALIZED,
      });
    }
  };

  init = async () => {
    await this.setState({ loading: true });
    await this.getConnectedState();
    await this.setState({ loading: false });
  };
  loadProps = async () => {
    let connectNetatmoStatus = STATUS.CONNECTING;
    let configuration = {};
    try {
      configuration = await this.props.httpClient.get('/api/v1/service/netatmo/config');
      if (Number(configuration.connected) === 1) connectNetatmoStatus = STATUS.CONNECTED; else connectNetatmoStatus = STATUS.DISCONNECTED;
    } catch (e) {
      console.error(e);
    } finally {
      this.setState({
        netatmoUsername: configuration.username,
        netatmoClientId: configuration.clientId,
        netatmoClientSecret: configuration.clientSecret,
        connectNetatmoStatusState: configuration.connected,
        netatmoScopesEnergy: configuration.scopes.scopeEnergy,
        netatmoScopes: configuration.scopes,
        connectNetatmoStatus,
        clientSecretChanges: false,
        showConnect: true
      });
    }
  };
  loadStatus = async () => {
    try {
      const netatmoStatus = await this.props.httpClient.get('/api/v1/service/netatmo/status');
      this.setState({
        netatmoConnected: netatmoStatus.connected
      });
    } catch (e) {
      this.setState({
        netatmoConnectionError: RequestStatus.NetworkError
      });
      console.error(e);
    }
  };

  updateStatus = async (state) => {
    this.setState({
      connectNetatmoStatus: state.status,
    });
  };

  updateStatusError = async (state) => {
    console.log('state', state)
    switch (state.statusType) {
      case STATUS.CONNECTING:
        this.setState({
          accessDenied: true,
          messageAlert: state.status
        });
        break;
      case STATUS.PROCESSING_TOKEN:
        this.setState({
          connectNetatmoStatus: state.status,
        });
        break;
    }
  };

  handleStateUpdateFromChild = (newState) => {
    this.setState(newState);
  };

  componentDidMount() {
    // this.init();
    this.loadProps();
    // this.loadStatus();
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.NETATMO.STATUS, this.updateStatus);
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.NETATMO.ERROR.CONNECTING, this.updateStatusError);
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.NETATMO.ERROR.PROCESSING_TOKEN, this.updateStatus);
  }

  componentWillUnmount() {
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.NETATMO.STATUS, this.updateStatus);
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.NETATMO.ERROR.CONNECTING, this.updateStatus);
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.NETATMO.ERROR.PROCESSING_TOKEN, this.updateStatus);
  }

  render(props, state, { loading }) {
    return (
      <NetatmoPage {...props} state={state} updateStateInIndex={this.handleStateUpdateFromChild}>
        <DeviceTab
          {...props}
          loading={loading}
          loadProps={this.loadProps}
          updateStateInIndex={this.handleStateUpdateFromChild}
        />
      </NetatmoPage>
    );
  }
}

export default connect('user,session,httpClient', {})(DevicePage);
