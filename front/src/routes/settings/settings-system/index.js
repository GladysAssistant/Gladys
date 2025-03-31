import { Component } from 'preact';
import { connect } from 'unistore/preact';
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
    this.props.getInfos();
    this.props.getDiskSpace();
    this.props.getContainers();

    // we start the ping a little bit after to give it some time to breathe
    this.refreshPingIntervalId = setInterval(() => {
      this.props.ping();
    }, 3000);

    // Listen to Watchtower logs
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.SYSTEM.WATCHTOWER_LOG, this.handleWatchtowerLog);
  }

  componentWillUnmount() {
    clearInterval(this.refreshPingIntervalId);
    this.props.session.dispatcher.removeListener(
      WEBSOCKET_MESSAGE_TYPES.SYSTEM.WATCHTOWER_LOG,
      this.handleWatchtowerLog
    );
  }

  handleWatchtowerLog = payload => {
    this.setState(prevState => ({
      watchtowerLogs: [...prevState.watchtowerLogs, payload.message]
    }));
  };

  render(props, { SystemUpgradeStatus, watchtowerLogs }) {
    return (
      <SettingsSystemPage
        {...props}
        upgradeGladys={this.upgradeGladys}
        SystemUpgradeStatus={SystemUpgradeStatus}
        watchtowerLogs={watchtowerLogs}
      />
    );
  }
}

export default connect('httpClient,session,systemPing,systemDiskSpace,systemInfos', actions)(SettingsSystem);
