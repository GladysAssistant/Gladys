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
    if (!props.z2mEnabled) {
      messageKey = 'integration.zigbee2mqtt.status.notEnabled';
      linkUrl = '/dashboard/integration/device/zigbee2mqtt/setup';
      linkText = 'integration.zigbee2mqtt.status.setupPageLink';
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
  'user,session,usbConfigured,z2mEnabled,zigbee2mqttStatusMqttConnected,zigbee2mqttStatusUsbConfigured,zigbee2mqttConnected',
  actions
)(CheckStatus);
