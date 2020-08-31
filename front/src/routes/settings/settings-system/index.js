import { Component } from 'preact';
import { connect } from 'unistore/preact';
import get from 'get-value';
import timezones from '../../../config/timezones';
import SettingsSystemPage from './SettingsSystemPage';
import actions from '../../../actions/system';
import { WEBSOCKET_MESSAGE_TYPES, SYSTEM_VARIABLE_NAMES } from '../../../../../server/utils/constants';
import { RequestStatus } from '../../../utils/consts';

@connect(
  'httpClient,session,systemPing,systemInfos,systemDiskSpace,systemContainers,downloadUpgradeProgress,downloadUpgradeStatus',
  actions
)
class SettingsSystem extends Component {
  updateTimezone = async option => {
    this.setState({
      savingTimezone: true,
      selectedTimezone: option
    });
    try {
      await this.props.httpClient.post(`/api/v1/variable/${SYSTEM_VARIABLE_NAMES.TIMEZONE}`, {
        value: option.value
      });
    } catch (e) {
      console.log(e);
    }
  };

  getTimezone = async () => {
    try {
      const { value } = await this.props.httpClient.get(`/api/v1/variable/${SYSTEM_VARIABLE_NAMES.TIMEZONE}`);
      const selectedTimezone = timezones.find(tz => tz.value === value);
      if (selectedTimezone) {
        this.setState({
          selectedTimezone
        });
      }
    } catch (e) {
      console.log(e);
    }
  };

  componentWillMount() {
    this.props.ping();
    this.props.getInfos();
    this.props.getDiskSpace();
    this.props.getContainers();
    this.props.getUpgradeDownloadStatus();
    this.getTimezone();
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

  render(props, { selectedTimezone }) {
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
        timezoneOptions={timezones}
        updateTimezone={this.updateTimezone}
        selectedTimezone={selectedTimezone}
      />
    );
  }
}

export default SettingsSystem;
