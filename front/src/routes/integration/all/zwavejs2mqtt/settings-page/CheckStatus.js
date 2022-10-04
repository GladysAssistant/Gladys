import { Component } from 'preact';
import { Link } from 'preact-router/match';
import { connect } from 'unistore/preact';
import actions from './actions';
import { Text } from 'preact-i18n';

@connect(
  'user,session,usbConfigured,mqttExist,mqttRunning,mqttConnected,zwavejs2mqttExist,zwavejs2mqttRunning',
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
      messageKey = 'integration.zwavejs2mqtt.status.notConfigured';
      linkUrl = '/dashboard/integration/device/zwavejs2mqtt/settings';
      linkText = 'integration.zwavejs2mqtt.status.settingsPageLink';
    } else if (!props.mqttExist) {
      messageKey = 'integration.zwavejs2mqtt.status.mqttNotInstalled';
    } else if (!props.mqttRunning) {
      messageKey = 'integration.zwavejs2mqtt.status.mqttNotRunning';
    } else if (!props.mqttConnected) {
      messageKey = 'integration.zwavejs2mqtt.status.gladysNotConnected';
    } else if (!props.zwavejs2mqttExist) {
      messageKey = 'integration.zwavejs2mqtt.status.zwavejs2mqttNotInstalled';
    } else if (!props.zwavejs2mqttRunning) {
      messageKey = 'integration.zwavejs2mqtt.status.zwavejs2mqttNotRunning';
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
