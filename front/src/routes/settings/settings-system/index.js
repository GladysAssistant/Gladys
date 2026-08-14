import { Component } from 'preact';
import { connect } from 'unistore/preact';
import dayjs from 'dayjs';

import SettingsSystemPage from './SettingsSystemPage';
import actions from '../../../actions/system';
import { RequestStatus } from '../../../utils/consts';
import { WEBSOCKET_MESSAGE_TYPES, SYSTEM_UPGRADE_ERROR_CODES } from '../../../../../server/utils/constants';

class SettingsSystem extends Component {
  constructor(props) {
    super(props);
    this.state = {
      SystemUpgradeStatus: null,
      watchtowerLogs: [],
      upgradeError: null
    };
  }

  upgradeGladys = async () => {
    this.setState({
      SystemUpgradeStatus: RequestStatus.Getting,
      watchtowerLogs: [],
      upgradeError: null
    });
    try {
      await this.props.httpClient.post('/api/v1/system/upgrade');
      // the route only acknowledges the request, the upgrade itself reports
      // over the websocket: an error can already have landed, and it wins
      this.setState(prevState =>
        prevState.SystemUpgradeStatus === RequestStatus.Error ? null : { SystemUpgradeStatus: RequestStatus.Success }
      );
    } catch (e) {
      console.error(e);
      // the error alert only renders when upgradeError is set: a failed POST
      // must show something, not just silently re-enable the button
      this.setState({
        SystemUpgradeStatus: RequestStatus.Error,
        upgradeError: { code: SYSTEM_UPGRADE_ERROR_CODES.UNKNOWN_ERROR }
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

    // the background refresh is silent: dimming the whole card every 30 seconds
    // would look like something is happening when nothing is
    this.refreshInfosIntervalId = setInterval(() => {
      this.getInfos({ silent: true });
    }, 30000);

    // Listen to Watchtower logs
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.SYSTEM.WATCHTOWER_LOG, this.handleWatchtowerLog);
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.SYSTEM.UPGRADE_ERROR, this.handleUpgradeError);
    this.props.session.dispatcher.addListener('websocket.connected', this.handleWebsocketConnected);
  }

  componentWillUnmount() {
    clearInterval(this.refreshPingIntervalId);
    clearInterval(this.refreshInfosIntervalId);
    this.props.session.dispatcher.removeListener(
      WEBSOCKET_MESSAGE_TYPES.SYSTEM.WATCHTOWER_LOG,
      this.handleWatchtowerLog
    );
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.SYSTEM.UPGRADE_ERROR, this.handleUpgradeError);
    this.props.session.dispatcher.removeListener('websocket.connected', this.handleWebsocketConnected);
  }

  handleWatchtowerLog = payload => {
    this.setState(prevState => ({
      watchtowerLogs: [...prevState.watchtowerLogs, payload.message]
    }));
  };

  handleUpgradeError = payload => {
    this.setState({
      SystemUpgradeStatus: RequestStatus.Error,
      upgradeError: payload
    });
  };

  handleWebsocketConnected = payload => {
    this.setState({
      websocketConnected: payload.connected
    });
  };

  checkForUpdates = async () => {
    // this check has its own status: the button reports its own progress and
    // result, so the card doesn't need to be dimmed while it runs
    this.setState({
      CheckForUpdatesStatus: RequestStatus.Getting
    });
    try {
      await this.props.httpClient.post('/api/v1/gateway/refresh-latest-gladys-version');
    } catch (e) {
      console.error(e);
      this.setState({
        CheckForUpdatesStatus: RequestStatus.Error
      });
      return;
    }
    const success = await this.getInfos({ silent: true });
    this.setState({
      CheckForUpdatesStatus: success ? RequestStatus.Success : RequestStatus.Error
    });
  };

  getInfos = async ({ silent = false } = {}) => {
    if (!silent) {
      this.setState({
        SystemGetInfosStatus: RequestStatus.Getting
      });
    }
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
      return true;
    } catch (e) {
      console.error(e);
      this.setState({
        SystemGetInfosStatus: RequestStatus.Error
      });
      return false;
    }
  };

  render(
    props,
    {
      SystemUpgradeStatus,
      watchtowerLogs,
      upgradeError,
      websocketConnected,
      SystemGetInfosStatus,
      CheckForUpdatesStatus,
      systemInfos
    }
  ) {
    return (
      <SettingsSystemPage
        {...props}
        upgradeGladys={this.upgradeGladys}
        SystemUpgradeStatus={SystemUpgradeStatus}
        watchtowerLogs={watchtowerLogs}
        upgradeError={upgradeError}
        websocketConnected={websocketConnected}
        checkForUpdates={this.checkForUpdates}
        SystemGetInfosStatus={SystemGetInfosStatus}
        CheckForUpdatesStatus={CheckForUpdatesStatus}
        getInfos={this.getInfos}
        systemInfos={systemInfos}
      />
    );
  }
}

export default connect('httpClient,user,session,systemPing,systemDiskSpace', actions)(SettingsSystem);
