import { Text } from 'preact-i18n';

const SetupRemoteSummary = ({ configuration, enableEditionMode, disabled }) => {
  const { mqttMode } = configuration;
  return (
    <div class="form-inline" data-cy="z2m-setup-remote-summary">
      <div class="form-group">
        <div>
          <div class="form-label">
            <Text id="integration.zigbee2mqtt.setup.modes.remote.summary.title" />
          </div>
          <div class="table-responsive pl-3">
            <small>
              <table>
                <tr>
                  <td class="pr-4">
                    <Text id="integration.zigbee2mqtt.setup.modes.remote.summary.mqttMode" />
                  </td>
                  <td class="text-muted" data-cy="z2m-setup-remote-mqtt-mode-summary">
                    <Text id={`integration.zigbee2mqtt.setup.modes.remote.${mqttMode}.modeLabel`} />
                  </td>
                </tr>
              </table>
            </small>
          </div>
        </div>
      </div>
      <button class="btn btn-primary btn-sm ml-auto" onClick={enableEditionMode} disabled={disabled}>
        <Text id="integration.zigbee2mqtt.setup.changeButtonLabel" />
      </button>
    </div>
  );
};

export default SetupRemoteSummary;
