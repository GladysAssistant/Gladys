import { Component } from 'preact';
import { connect } from 'unistore/preact';
import get from 'get-value';
import SettingsSystemPage from './SettingsSystemPage';
import actions from '../../../actions/system';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../server/utils/constants';
import { RequestStatus } from '../../../utils/consts';

@connect(
  'session,systemPing,systemInfos,systemDiskSpace,systemContainers,downloadUpgradeProgress,downloadUpgradeStatus',
  actions
)
class SettingsSystem extends Component {
  componentWillMount() {
    this.props.ping();
    this.props.getInfos();
    this.props.getDiskSpace();
    this.props.getContainers();
    this.props.getUpgradeDownloadStatus();
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.UPGRADE.DOWNLOAD_PROGRESS, payload =>
      this.props.newDownloadProgress(payload)
    );
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.UPGRADE.DOWNLOAD_FINISHED, payload =>
      this.props.downloadFinished()
    );
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.UPGRADE.DOWNLOAD_FAILED, payload =>
      this.props.downloadFailed()
    );
  }

  render(props, {}) {
    const isDocker = get(props, 'systemInfos.is_docker');
    const upgradeDownloadInProgress = props.downloadUpgradeStatus === RequestStatus.Getting;
    const upgradeDownloadFinished = props.downloadUpgradeStatus === RequestStatus.Success;
    const upgradeAvailable =
      !upgradeDownloadInProgress && !upgradeDownloadFinished && get(props, 'systemInfos.new_release_available');
    return (
      <SettingsSystemPage
        {...props}
        isDocker={isDocker}
        upgradeDownloadInProgress={upgradeDownloadInProgress}
        upgradeDownloadFinished={upgradeDownloadFinished}
        upgradeAvailable={upgradeAvailable}
      />
    );
  }
}

export default SettingsSystem;
