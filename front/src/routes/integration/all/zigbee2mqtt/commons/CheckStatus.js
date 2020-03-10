import { Component } from 'preact';
import { Link } from 'preact-router/match';
import { connect } from 'unistore/preact';
import actions from './actions';
import { Text } from 'preact-i18n';

@connect('user,session,zigbee2mqttStatusConnected,zigbee2mqttStatusConfigured', actions)
class CheckStatus extends Component {
  componentWillMount() {
    this.props.checkStatus();
  }

  render(props, {}) {
    let messageKey;
    if (!props.zigbee2mqttStatusConfigured) {
      messageKey = 'integration.mqtt.status.notConfigured';
    } else if (!props.zigbee2mqttStatusConnected) {
      messageKey = 'integration.mqtt.status.notConnected';
    } else {
      return null;
    }

    return (
      <div class="alert alert-warning">
        <Text id={messageKey} />
        <Link href="/dashboard/integration/device/zigbee2mqtt/setup">
          <Text id="integration.zigbee2mqtt.status.setupPageLink" />
        </Link>
      </div>
    );
  }
}

export default CheckStatus;
