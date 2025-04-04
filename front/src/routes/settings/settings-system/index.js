import { Component } from 'preact';
import { connect } from 'unistore/preact';
import dayjs from 'dayjs';

import SettingsSystemPage from './SettingsSystemPage';
import actions from '../../../actions/system';
import { RequestStatus } from '../../../utils/consts';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../server/utils/constants';

class SettingsSystem extends Component {
  constructor(props) {
    super(props);
    this.state = {
      SystemUpgradeStatus: null,
      watchtowerLogs: []
    };
  }

  upgradeGladys = async () => {
    this.setState({
      SystemUpgradeStatus: RequestStatus.Getting,
      watchtowerLogs: []
    });
    try {
      await this.props.httpClient.post('/api/v1/system/upgrade');
      this.setState({
        SystemUpgradeStatus: RequestStatus.Success
      });
    } catch (e) {
      console.error(e);
      this.setState({
        SystemUpgradeStatus: RequestStatus.Error
      });
    }
  };

  componentDidMount() {
    this.getInfos();
    this.props.getDiskSpace();
    this.props.getContainers();

    // we start the ping a little bit after to give it some time to breathe
    this.refreshPingIntervalId = setInterval(() => {
      this.props.ping();
    }, 3000);

    // Listen to Watchtower logs
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.SYSTEM.WATCHTOWER_LOG, this.handleWatchtowerLog);
    this.props.session.dispatcher.addListener('websocket.connected', this.handleWebsocketConnected);
  }

  componentWillUnmount() {
    clearInterval(this.refreshPingIntervalId);
    this.props.session.dispatcher.removeListener(
      WEBSOCKET_MESSAGE_TYPES.SYSTEM.WATCHTOWER_LOG,
      this.handleWatchtowerLog
    );
    this.props.session.dispatcher.removeListener('websocket.connected', this.handleWebsocketConnected);
  }

  handleWatchtowerLog = payload => {
    this.setState(prevState => ({
      watchtowerLogs: [...prevState.watchtowerLogs, payload.message]
    }));
  };

  handleWebsocketConnected = payload => {
    this.setState({
      websocketConnected: payload.connected
    });
  };

  checkForUpdates = async () => {
    try {
      this.setState({
        SystemGetInfosStatus: RequestStatus.Getting
      });
      await this.props.httpClient.post('/api/v1/gateway/refresh-latest-gladys-version');
      await this.getInfos();
    } catch (e) {
      console.error(e);
      this.setState({
        SystemGetInfosStatus: RequestStatus.Error
      });
    }
  };

  getInfos = async () => {
    this.setState({
      SystemGetInfosStatus: RequestStatus.Getting
    });
    try {
      const systemInfos = await this.props.httpClient.get('/api/v1/system/info');
      const today = new Date().getTime();
      const systemStartedAt = today - systemInfos.uptime * 1000;
      systemInfos.uptime_formatted = dayjs(systemStartedAt)
        .locale(this.props.user.language)
        .fromNow();
      this.setState({
        systemInfos,
        SystemGetInfosStatus: RequestStatus.Success
      });
    } catch (e) {
      console.error(e);
      this.setState({
        SystemGetInfosStatus: RequestStatus.Error
      });
    }
  };

  render(props, { SystemUpgradeStatus, watchtowerLogs, websocketConnected, SystemGetInfosStatus, systemInfos }) {
    return (
      <SettingsSystemPage
        {...props}
        upgradeGladys={this.upgradeGladys}
        SystemUpgradeStatus={SystemUpgradeStatus}
        watchtowerLogs={watchtowerLogs}
        websocketConnected={websocketConnected}
        checkForUpdates={this.checkForUpdates}
        SystemGetInfosStatus={SystemGetInfosStatus}
        getInfos={this.getInfos}
        systemInfos={systemInfos}
      />
    );
  }
}

export default connect('httpClient,user,session,systemPing,systemDiskSpace', actions)(SettingsSystem);
