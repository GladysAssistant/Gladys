import { Component } from 'preact';
import { Link } from 'preact-router/match';
import { connect } from 'unistore/preact';
import actions from './actions';
import { Text } from 'preact-i18n';

@connect(
  'user,session,mqttExist,mqttRunning,zwave2mqttExist,zwave2mqttRunning,gladysConnected,zwave2mqttConfigured,zwave2mqttConnected',
  actions
)
class CheckStatus extends Component {
  componentWillMount() {
    this.props.checkStatus();
  }

  render(props, {}) {
    let messageKey;
    let linkUrl = '';
    let linkText = '';
    if (!props.zwave2mqttConfigured) {
      messageKey = 'integration.zwave2mqtt.status.notConfigured';
      linkUrl = '/dashboard/integration/device/zwave2mqtt/settings';
      linkText = 'integration.zwave2mqtt.status.settingsPageLink';
    } else if (props.z2mEnabled) {
      if (!props.mqttExist) {
        messageKey = 'integration.zwave2mqtt.status.mqttNotInstalled';
      } else if (!props.mqttRunning) {
        messageKey = 'integration.zwave2mqtt.status.mqttNotRunning';
      } else if (!props.zwave2mqttExist) {
        messageKey = 'integration.zwave2mqtt.status.zwave2mqttNotInstalled';
      } else if (!props.zwave2mqttRunning) {
        messageKey = 'integration.zwave2mqtt.status.zwave2mqttNotRunning';
      } else if (!props.gladysConnected) {
        messageKey = 'integration.zwave2mqtt.status.gladysNotConnected';
      } else if (!props.zwave2mqttConnected) {
        messageKey = 'integration.zwave2mqtt.status.zwave2mqttNotConnected';
      }
    } else {
      return null;
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
