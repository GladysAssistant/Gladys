import { MarkupText } from 'preact-i18n';
import get from 'get-value';

// Zigbee2mqtt answers the health check Gladys follows it with since 1.21 (see handleMqttMessage on the server)
const isTooOld = version => {
  if (!version) {
    return false;
  }
  const [major, minor] = `${version}`.split('.').map(part => parseInt(part, 10));
  return major < 1 || (major === 1 && minor < 21);
};

// An external broker where Zigbee2mqtt does not answer yet: the broker lost, a version that never will, or what to
// check
const WaitingText = ({ status }) => {
  if (!status.gladysConnected) {
    const message = get(status, 'mqttConnectionError.message');
    return (
      <div data-cy="z2m-wizard-broker-lost">
        <MarkupText id="integration.zigbee2mqtt.setup.wizard.progress.brokerLost" />
        {message && <code class="d-block mt-1">{message}</code>}
      </div>
    );
  }
  return isTooOld(status.z2mVersion) ? (
    <MarkupText
      id="integration.zigbee2mqtt.setup.wizard.progress.zigbee2mqttTooOld"
      fields={{ version: status.z2mVersion }}
    />
  ) : (
    <MarkupText id="integration.zigbee2mqtt.setup.wizard.progress.waitingZigbee2mqtt" />
  );
};

export default WaitingText;
