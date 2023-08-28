import { Text } from 'preact-i18n';

const SetupLocalSummary = ({ configuration, enableEditionMode, disabled }) => {
  const { z2mDriverPath, z2mDongleName, z2mTcpPort } = configuration;
  return (
    <div class="form-inline" data-cy="z2m-setup-local-summary">
      <div class="form-group">
        <div>
          <div class="form-label">
            <Text id="integration.zigbee2mqtt.setup.modes.local.summary.title" />
          </div>
          <div class="table-responsive pl-3">
            <small>
              <table>
                <tr>
                  <td class="pr-4">
                    <Text id="integration.zigbee2mqtt.setup.modes.local.summary.usbPort" />
                  </td>
                  <td class="text-muted" data-cy="z2m-setup-local-usb-summary">
                    {z2mDriverPath}
                  </td>
                </tr>
                <tr>
                  <td class="pr-4">
                    <Text id="integration.zigbee2mqtt.setup.modes.local.summary.dongleName" />
                  </td>
                  <td class="text-muted" data-cy="z2m-setup-local-dongle-summary">
                    {z2mDongleName || <Text id="integration.zigbee2mqtt.setup.modes.local.summary.unknownDongle" />}
                  </td>
                </tr>
                <tr>
                  <td class="pr-4">
                    <Text id="integration.zigbee2mqtt.setup.modes.local.summary.tcpPort" />
                  </td>
                  <td class="text-muted" data-cy="z2m-setup-local-tcp-summary">
                    {z2mTcpPort}
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

export default SetupLocalSummary;
