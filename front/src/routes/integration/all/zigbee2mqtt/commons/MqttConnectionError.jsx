import { Text } from 'preact-i18n';

// Why Gladys cannot connect to the MQTT broker: a known error code is explained, any other error is shown as is
const MqttConnectionError = ({ error }) =>
  error.code ? (
    <Text id={`integration.zigbee2mqtt.setup.mqttConnectionErrors.${error.code}`} />
  ) : (
    <span>
      <Text id="integration.zigbee2mqtt.setup.mqttConnectionErrors.unknownErrorPrefix" />
      <code>{error.message}</code>
    </span>
  );

export default MqttConnectionError;
