import { Text, MarkupText } from 'preact-i18n';

// Why Zigbee2mqtt fails to start: a known error code is explained, with its details if any (the settings refused
// by Zigbee2mqtt), any other error is shown as is
const ContainerError = ({ error }) =>
  error.code ? (
    <span>
      <MarkupText id={`integration.zigbee2mqtt.setup.modes.local.containerErrors.${error.code}`} />
      {error.message && (
        <div class="mt-1">
          <code data-cy="z2m-container-error-details">{error.message}</code>
        </div>
      )}
    </span>
  ) : (
    <span>
      <Text id="integration.zigbee2mqtt.setup.modes.local.containerErrors.unknownErrorPrefix" />
      <code>{error.message}</code>
    </span>
  );

export default ContainerError;
