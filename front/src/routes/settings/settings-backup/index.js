import { Component } from 'preact';
import { connect } from 'unistore/preact';
import get from 'get-value';
import GatewayBackupPage from './GatewayBackupPage';
import UpgradePlan from './UpgradePlan';
import GatewayNotConfigured from './GatewayNotConfigured';

import actions from '../../../actions/gateway';

class SettingsGateway extends Component {
  getMySelfGateway = async () => {
    try {
      if (!this.props.session.gatewayClient) {
        this.setState({
          isFullGladysPlus: true
        });
        return;
      }
      const user = await this.props.session.gatewayClient.getMyself();
      const isFullGladysPlus = user.plan !== 'lite';
      this.setState({
        isFullGladysPlus
      });
    } catch (e) {
      console.error(e);
    }
  };

  state = {
    isFullGladysPlus: null
  };

  componentWillMount() {
    this.getMySelfGateway();
    this.props.getStatus();
    this.props.getBackups();
    this.props.getRestoreStatus();
  }

  render(props, { isFullGladysPlus }) {
    if (get(props, 'gatewayStatus.configured') === false) {
      return <GatewayNotConfigured />;
    }
    if (isFullGladysPlus === null) {
      return <div />;
    }
    if (isFullGladysPlus) {
      return <GatewayBackupPage {...props} />;
    }

    return <UpgradePlan />;
  }
}

export default connect(
  'user,session,gatewayStatus,gatewayBackups,gatewayRestoreInProgress,gatewayCreateBackupStatus,gatewayRestoreErrored,gatewayGladysRestarting',
  actions
)(SettingsGateway);
