import { Component } from 'preact';
import { Link } from 'preact-router/match';
import { connect } from 'unistore/preact';
import actions from './actions';
import { Text } from 'preact-i18n';

@connect(
  'user,session,usbConfigured,mqttExist,mqttRunning,zwaveExist,zwaveRunning,mqttConnected,zwaveConnected',
  actions
)
class CheckStatus extends Component {
  componentWillMount() {
    this.props.getStatus();
  }

  render(props, {}) {
    let messageKey;
    let linkUrl = '';
    let linkText = '';
    if (!props.usbConfigured) {
      messageKey = 'integration.zwave.status.notConfigured';
      linkUrl = '/dashboard/integration/device/zwavejs2mqtt/settings';
      linkText = 'integration.zwave.status.settingsPageLink';
    } else if (!props.mqttExist) {
      messageKey = 'integration.zwave.status.mqttNotInstalled';
    } else if (!props.mqttRunning) {
      messageKey = 'integration.zwave.status.mqttNotRunning';
    } else if (!props.zwaveExist) {
      messageKey = 'integration.zwave.status.zwaveNotInstalled';
    } else if (!props.zwaveRunning) {
      messageKey = 'integration.zwave.status.zwaveNotRunning';
    } else if (!props.mqttConnected) {
      messageKey = 'integration.zwave.status.gladysNotConnected';
    } else if (!props.zwaveConnected) {
      messageKey = 'integration.zwave.status.zwaveNotConnected';
    }

    return (
      <div class="alert alert-warning">
        <Text id={messageKey} />
        <Link href={linkUrl}>
          <Text id={linkText} />
        </Link>
      </div>
    );
  }
}

export default CheckStatus;
