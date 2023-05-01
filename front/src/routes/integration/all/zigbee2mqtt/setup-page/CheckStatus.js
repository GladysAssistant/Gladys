import { Component } from 'preact';
import { Link } from 'preact-router/match';
import { connect } from 'unistore/preact';
import actions from './actions';
import { Text } from 'preact-i18n';

class CheckStatus extends Component {
  componentWillMount() {
    this.props.checkStatus();
  }

  render(props, {}) {
    let messageKey;
    let linkUrl = '';
    let linkText = '';
    if (!props.usbConfigured) {
      messageKey = 'integration.zigbee2mqtt.status.notConfigured';
      linkUrl = '/dashboard/integration/device/zigbee2mqtt/settings';
      linkText = 'integration.zigbee2mqtt.status.settingsPageLink';
    } else if (props.z2mEnabled) {
      if (!props.mqttExist) {
        messageKey = 'integration.zigbee2mqtt.status.mqttNotInstalled';
      } else if (!props.mqttRunning) {
        messageKey = 'integration.zigbee2mqtt.status.mqttNotRunning';
      } else if (!props.zigbee2mqttExist) {
        messageKey = 'integration.zigbee2mqtt.status.zigbee2mqttNotInstalled';
      } else if (!props.zigbee2mqttRunning) {
        messageKey = 'integration.zigbee2mqtt.status.zigbee2mqttNotRunning';
      } else if (!props.gladysConnected) {
        messageKey = 'integration.zigbee2mqtt.status.gladysNotConnected';
      } else if (!props.zigbee2mqttConnected) {
        messageKey = 'integration.zigbee2mqtt.status.zigbee2mqttNotConnected';
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

export default connect(
  'user,session,usbConfigured,mqttExist,mqttRunning,zigbee2mqttExist,zigbee2mqttRunning,gladysConnected,zigbee2mqttConnected',
  actions
)(CheckStatus);
