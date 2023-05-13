import { Component } from 'preact';
import { connect } from 'unistore/preact';
import get from 'get-value';
import timezones from '../../../config/timezones';
import SettingsSystemPage from './SettingsSystemPage';
import actions from '../../../actions/system';
import { SYSTEM_VARIABLE_NAMES } from '../../../../../server/utils/constants';
import { RequestStatus } from '../../../utils/consts';

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
      console.error(e);
    }
  };

  vacuumDatabase = async e => {
    e.preventDefault();
    this.setState({
      vacuumStarted: true
    });
    try {
      await this.props.httpClient.post('/api/v1/system/vacuum');
    } catch (e) {
      console.error(e);
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
      console.error(e);
    }
  };

  updateDeviceStateHistory = async e => {
    await this.setState({
      deviceStateHistoryInDays: e.target.value,
      savingDeviceStateHistory: true
    });
    try {
      await this.props.httpClient.post(`/api/v1/variable/${SYSTEM_VARIABLE_NAMES.DEVICE_STATE_HISTORY_IN_DAYS}`, {
        value: e.target.value
      });
    } catch (e) {
      console.error(e);
    }
    await this.setState({
      savingDeviceStateHistory: false
    });
  };

  getDeviceStateHistoryPreference = async () => {
    try {
      const { value } = await this.props.httpClient.get(
        `/api/v1/variable/${SYSTEM_VARIABLE_NAMES.DEVICE_STATE_HISTORY_IN_DAYS}`
      );
      this.setState({
        deviceStateHistoryInDays: value
      });
    } catch (e) {
      console.error(e);
    }
  };

  componentDidMount() {
    this.props.getInfos();
    this.props.getDiskSpace();
    this.props.getContainers();
    this.getTimezone();
    this.getDeviceStateHistoryPreference();
    // we start the ping a little bit after to give it some time to breathe
    this.refreshPingIntervalId = setInterval(() => {
      this.props.ping();
    }, 3000);
  }

  componentWillUnmount() {
    clearInterval(this.refreshPingIntervalId);
  }

  constructor(props) {
    super(props);
    this.state = {
      vacuumStarted: false
    };
  }

  render(props, { selectedTimezone, deviceStateHistoryInDays, vacuumStarted }) {
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
        deviceStateHistoryInDays={deviceStateHistoryInDays}
        updateDeviceStateHistory={this.updateDeviceStateHistory}
        vacuumDatabase={this.vacuumDatabase}
        vacuumStarted={vacuumStarted}
      />
    );
  }
}

export default connect(
  'httpClient,session,systemPing,systemInfos,systemDiskSpace,systemContainers,downloadUpgradeProgress,downloadUpgradeStatus',
  actions
)(SettingsSystem);
