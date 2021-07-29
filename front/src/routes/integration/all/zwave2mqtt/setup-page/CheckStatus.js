import { Component } from 'preact';
import { Link } from 'preact-router/match';
import { connect } from 'unistore/preact';
import actions from './actions';
import { Text } from 'preact-i18n';

@connect(
  'user,session,mqttExist,mqttConfigured,mqttConnected,zwave2mqttExist,zwave2mqttConfigured,zwave2mqttConnected,gladysConnected',
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
      } else if (!props.mqttConfigured) {
        messageKey = 'integration.zwave2mqtt.status.mqttNotConfigured';
      } else if (!props.mqttConnected) {
        messageKey = 'integration.zwave2mqtt.status.mqttNotConnected';
      } else if (!props.zwave2mqttExist) {
        messageKey = 'integration.zwave2mqtt.status.zwave2mqttNotInstalled';
      } else if (!props.zwave2mqttConfigured) {
        messageKey = 'integration.zwave2mqtt.status.zwave2mqttNotConfigured';
      } else if (!props.zwave2mqttConnected) {
        messageKey = 'integration.zwave2mqtt.status.zwave2mqttNotConnected';
      } else if (!props.gladysConnected) {
        messageKey = 'integration.zwave2mqtt.status.gladysNotConnected';
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
