import { Component } from 'preact';
import { connect } from 'unistore/preact';
import SettingsSystemPage from './SettingsSystemPage';
import actions from '../../../actions/system';
import { RequestStatus } from '../../../utils/constants';

class SettingsSystem extends Component {
  upgradeGladys = async () => {
    this.setState({
      SystemUpgradeStatus: RequestStatus.Getting
    });
    try {
      await state.httpClient.post('/api/v1/system/upgrade');
      store.setState({
        SystemUpgradeStatus: RequestStatus.Success
      });
    } catch (e) {
      store.setState({
        SystemGetDiskSpaceStatus: RequestStatus.Error
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
  }

  componentWillUnmount() {
    clearInterval(this.refreshPingIntervalId);
  }

  render(props, {}) {
    return <SettingsSystemPage {...props} upgradeGladys={this.upgradeGladys} />;
  }
}

export default connect('httpClient,session,systemPing,systemDiskSpace,systemInfos', actions)(SettingsSystem);
