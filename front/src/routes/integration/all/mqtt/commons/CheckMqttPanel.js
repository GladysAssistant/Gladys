import { Component } from 'preact';
import { Link } from 'preact-router/match';
import { connect } from 'unistore/preact';
import actions from './actions';
import { Text } from 'preact-i18n';
import { MobileNotice } from '../../../../../components/mobile';

class CheckMqttPanel extends Component {
  componentWillMount() {
    this.props.checkStatus();
  }

  render(props, {}) {
    let messageKey;
    if (!props.mqttStatusConfigured) {
      messageKey = 'integration.mqtt.status.notConfigured';
    } else if (!props.mqttStatusConnected) {
      messageKey = 'integration.mqtt.status.notConnected';
    } else {
      return null;
    }

    if (!props.mqttStatusLoaded) {
      return null;
    }

    if (props.isMobile) {
      return (
        <MobileNotice tone="warning" icon="alert-triangle" data-cy="mqtt-status-notice">
          <Text id={messageKey} />
          <Link href="/dashboard/integration/device/mqtt/setup">
            <Text id="integration.mqtt.status.setupPageLink" />
          </Link>
        </MobileNotice>
      );
    }

    return (
      <div class="alert alert-warning">
        <Text id={messageKey} />
        <Link href="/dashboard/integration/device/mqtt/setup">
          <Text id="integration.mqtt.status.setupPageLink" />
        </Link>
      </div>
    );
  }
}

export default connect(
  'user,session,mqttStatusConnected,mqttStatusConfigured,mqttStatusLoaded',
  actions
)(CheckMqttPanel);
