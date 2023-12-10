import { Component } from 'preact';
import { connect } from 'unistore/preact';
import SettingsSystemPage from './SettingsSystemPage';
import actions from '../../../actions/system';

class SettingsSystem extends Component {
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
    return <SettingsSystemPage {...props} />;
  }
}

export default connect('httpClient,session,systemPing,systemDiskSpace,systemInfos', actions)(SettingsSystem);
