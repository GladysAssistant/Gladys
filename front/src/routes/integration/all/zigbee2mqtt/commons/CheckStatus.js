import { Component } from 'preact';
import { Link } from 'preact-router/match';
import { connect } from 'unistore/preact';
import actions from './actions';
import { Text } from 'preact-i18n';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../../server/utils/constants';
import ContainerError from './ContainerError';

class CheckStatus extends Component {
  componentWillMount() {
    this.props.checkStatus();
  }

  componentDidMount() {
    // Follow the state live: the banner goes away as soon as Zigbee2mqtt reports itself online
    this.props.session.dispatcher.addListener(
      WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.STATUS_CHANGE,
      this.props.updateStatus
    );
  }

  componentWillUnmount() {
    this.props.session.dispatcher.removeListener(
      WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.STATUS_CHANGE,
      this.props.updateStatus
    );
  }

  render({ gladysConnected, zigbee2mqttConnected, zigbee2mqttExist, z2mContainerError }) {
    // Same condition as the permit join switch: Zigbee2mqtt is usable only once it reported itself online
    if (gladysConnected && zigbee2mqttConnected) {
      return null;
    }

    // An installed Zigbee2mqtt (its container, or a broker Gladys is connected to in external mode) that does
    // not answer is not a disabled one: say so, and why when known
    const installed = zigbee2mqttExist || gladysConnected;
    const messageKey = installed
      ? 'integration.zigbee2mqtt.status.notRunning'
      : 'integration.zigbee2mqtt.status.notEnabled';

    return (
      <div class="alert alert-warning" data-cy="z2m-status-alert">
        <Text id={messageKey} />
        <Link href="/dashboard/integration/device/zigbee2mqtt/setup">
          <Text id="integration.zigbee2mqtt.status.setupPageLink" />
        </Link>
        {installed && z2mContainerError && (
          <div class="mt-2" data-cy="z2m-status-alert-error">
            <ContainerError error={z2mContainerError} />
          </div>
        )}
      </div>
    );
  }
}

export default connect(
  'session,gladysConnected,zigbee2mqttConnected,zigbee2mqttExist,z2mContainerError',
  actions
)(CheckStatus);
