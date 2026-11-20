import { Component } from 'preact';
import { Link } from 'preact-router/match';
import { connect } from 'unistore/preact';
import actions from './actions';
import { Text } from 'preact-i18n';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../../server/utils/constants';
import ContainerError from './ContainerError';
import MqttConnectionError from './MqttConnectionError';
import { MobileNotice, BigButton } from '../../../../../components/mobile';
import { integrationMobileStyle } from '../../../../../components/integration/mobile';

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

  render({
    gladysConnected,
    zigbee2mqttConnected,
    zigbee2mqttExist,
    z2mContainerError,
    mqttConnectionError,
    z2mConfigured,
    z2mStopped,
    isMobile
  }) {
    // Same condition as the permit join switch: Zigbee2mqtt is usable only once it reported itself online
    if (gladysConnected && zigbee2mqttConnected) {
      return null;
    }

    // Nothing set up yet (no coordinator, no external broker): the setup page installs it. Unknown before the status
    // is read, or from a server that does not tell it: the messages below
    if (z2mConfigured === false) {
      // On a phone (docs/specs/mobile-pages/integration-devices.md): the way to install it is a full-width button
      if (isMobile) {
        return (
          <div class={integrationMobileStyle.block} data-cy="z2m-status-not-installed">
            <MobileNotice icon="info">
              <Text id="integration.zigbee2mqtt.status.notInstalled" />
            </MobileNotice>
            <BigButton variant="primary" icon="download" href="/dashboard/integration/device/zigbee2mqtt/setup">
              <Text id="integration.zigbee2mqtt.status.install" />
            </BigButton>
          </div>
        );
      }
      return (
        <div class="alert alert-info d-flex flex-wrap align-items-center" data-cy="z2m-status-not-installed">
          <span class="mr-3 mb-1">
            <Text id="integration.zigbee2mqtt.status.notInstalled" />
          </span>
          <Link href="/dashboard/integration/device/zigbee2mqtt/setup" class="btn btn-primary btn-sm">
            <Text id="integration.zigbee2mqtt.status.install" />
          </Link>
        </div>
      );
    }

    // Stopped: the errors of the run before the stop no longer describe anything
    const mqttError =
      !z2mStopped && mqttConnectionError && (mqttConnectionError.code || mqttConnectionError.message)
        ? mqttConnectionError
        : null;
    // An installed Zigbee2mqtt that does not answer is not a disabled one: say so, and why when known
    let messageKey = 'integration.zigbee2mqtt.status.notEnabled';
    if (z2mStopped) {
      // Stopped by the user from the setup page: the cause is known, nothing else to look at
      messageKey = 'integration.zigbee2mqtt.status.stopped';
    } else if (gladysConnected) {
      // Gladys hears the broker (with or without container, in external mode), but Zigbee2mqtt does not answer
      messageKey = 'integration.zigbee2mqtt.status.notRunning';
    } else if (zigbee2mqttExist || mqttError) {
      // Gladys does not reach the broker: Zigbee2mqtt may run fine, the broker is the one to look at
      messageKey = 'integration.zigbee2mqtt.status.mqttNotConnected';
    }

    if (isMobile) {
      return (
        <MobileNotice tone="warning" icon="alert-triangle" data-cy="z2m-status-alert">
          <Text id={messageKey} />
          <Link href="/dashboard/integration/device/zigbee2mqtt/setup">
            <Text id="integration.zigbee2mqtt.status.setupPageLink" />
          </Link>
          {mqttError && (
            <div class="mt-2" data-cy="z2m-status-alert-mqtt-error">
              <MqttConnectionError error={mqttError} />
            </div>
          )}
          {z2mContainerError && (
            <div class="mt-2" data-cy="z2m-status-alert-error">
              <ContainerError error={z2mContainerError} />
            </div>
          )}
        </MobileNotice>
      );
    }

    return (
      <div class="alert alert-warning" data-cy="z2m-status-alert">
        <Text id={messageKey} />
        <Link href="/dashboard/integration/device/zigbee2mqtt/setup">
          <Text id="integration.zigbee2mqtt.status.setupPageLink" />
        </Link>
        {mqttError && (
          <div class="mt-2" data-cy="z2m-status-alert-mqtt-error">
            <MqttConnectionError error={mqttError} />
          </div>
        )}
        {z2mContainerError && (
          <div class="mt-2" data-cy="z2m-status-alert-error">
            <ContainerError error={z2mContainerError} />
          </div>
        )}
      </div>
    );
  }
}

export default connect(
  'session,gladysConnected,zigbee2mqttConnected,zigbee2mqttExist,z2mContainerError,mqttConnectionError,z2mConfigured,z2mStopped',
  actions
)(CheckStatus);
