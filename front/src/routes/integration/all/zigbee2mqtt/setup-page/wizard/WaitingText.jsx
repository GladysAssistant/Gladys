import { MarkupText } from 'preact-i18n';

// Zigbee2mqtt answers the health check Gladys follows it with since 1.21 (see handleMqttMessage on the server)
const isTooOld = version => {
  if (!version) {
    return false;
  }
  const [major, minor] = `${version}`.split('.').map(part => parseInt(part, 10));
  return major < 1 || (major === 1 && minor < 21);
};

// An external broker where Zigbee2mqtt does not answer yet: a version that never will, or what to check
const WaitingText = ({ version }) =>
  isTooOld(version) ? (
    <MarkupText id="integration.zigbee2mqtt.setup.wizard.progress.zigbee2mqttTooOld" fields={{ version }} />
  ) : (
    <MarkupText id="integration.zigbee2mqtt.setup.wizard.progress.waitingZigbee2mqtt" />
  );

export default WaitingText;
