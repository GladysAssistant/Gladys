import { Text } from 'preact-i18n';

const UnknownError = ({ error }) => (
  <span>
    <Text id="integration.zigbee2mqtt.setup.mqttConnectionErrors.unknownErrorPrefix" />
    <code>{error.message || error.code}</code>
  </span>
);

// Why Gladys cannot connect to the MQTT broker: a known error code is explained, any other error (a code without a
// text of its own included) is shown as is
const MqttConnectionError = ({ error }) =>
  error.code ? (
    <Text id={`integration.zigbee2mqtt.setup.mqttConnectionErrors.${error.code}`}>
      <UnknownError error={error} />
    </Text>
  ) : (
    <UnknownError error={error} />
  );

export default MqttConnectionError;
