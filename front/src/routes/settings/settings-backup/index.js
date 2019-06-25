import { Component } from 'preact';
import { connect } from 'unistore/preact';
import GatewayBackupPage from './GatewayBackupPage';
import actions from '../../../actions/gateway';

@connect(
  'user,gatewayStatus,gatewayBackups,gatewayRestoreInProgress',
  actions
)
class SettingsGateway extends Component {
  componentWillMount() {
    this.props.getStatus();
    this.props.getBackups();
    this.props.getRestoreStatus();
  }

  render(props, {}) {
    return <GatewayBackupPage {...props} />;
  }
}

export default SettingsGateway;
