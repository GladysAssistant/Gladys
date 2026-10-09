import { Text } from 'preact-i18n';

import { ADAPTER_MODE } from '../constants';

const SetupLocalSummary = ({ configuration, enableEditionMode, disabled }) => {
  const {
    z2mDriverPath,
    z2mDongleName,
    z2mTcpPort,
    z2mAdapterMode,
    z2mNetworkAdapterUrl,
    z2mNetworkAdapterType
  } = configuration;
  const networkMode = z2mAdapterMode === ADAPTER_MODE.NETWORK;
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
                {networkMode ? (
                  <tr>
                    <td class="pr-4">
                      <Text id="integration.zigbee2mqtt.setup.modes.local.summary.networkAdapterUrl" />
                    </td>
                    <td class="text-muted" data-cy="z2m-setup-local-network-url-summary">
                      {z2mNetworkAdapterUrl}
                    </td>
                  </tr>
                ) : (
                  <tr>
                    <td class="pr-4">
                      <Text id="integration.zigbee2mqtt.setup.modes.local.summary.usbPort" />
                    </td>
                    <td class="text-muted" data-cy="z2m-setup-local-usb-summary">
                      {z2mDriverPath}
                    </td>
                  </tr>
                )}
                {networkMode ? (
                  <tr>
                    <td class="pr-4">
                      <Text id="integration.zigbee2mqtt.setup.modes.local.summary.networkAdapterType" />
                    </td>
                    <td class="text-muted" data-cy="z2m-setup-local-network-type-summary">
                      {z2mNetworkAdapterType}
                    </td>
                  </tr>
                ) : (
                  <tr>
                    <td class="pr-4">
                      <Text id="integration.zigbee2mqtt.setup.modes.local.summary.dongleName" />
                    </td>
                    <td class="text-muted" data-cy="z2m-setup-local-dongle-summary">
                      {z2mDongleName || <Text id="integration.zigbee2mqtt.setup.modes.local.summary.unknownDongle" />}
                    </td>
                  </tr>
                )}
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
