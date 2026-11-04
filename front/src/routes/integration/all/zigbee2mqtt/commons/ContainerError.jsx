import { Text, MarkupText } from 'preact-i18n';

// Why Zigbee2mqtt fails to start: a known error code is explained, any other error is shown as is
const ContainerError = ({ error }) =>
  error.code ? (
    <MarkupText id={`integration.zigbee2mqtt.setup.modes.local.containerErrors.${error.code}`} />
  ) : (
    <span>
      <Text id="integration.zigbee2mqtt.setup.modes.local.containerErrors.unknownErrorPrefix" />
      <code>{error.message}</code>
    </span>
  );

export default ContainerError;
