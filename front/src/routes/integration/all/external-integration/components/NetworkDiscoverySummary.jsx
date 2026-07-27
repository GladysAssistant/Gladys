import { Text } from 'preact-i18n';

// The network_discovery field of the manifest is an authorization
// contract (like the hardware requests): what is declared here is what
// the user approves on the install screen — the integration will never
// be able to capture anything else.
const NetworkDiscoverySummary = ({ networkDiscovery }) => {
  if (!networkDiscovery || networkDiscovery.length === 0) {
    return null;
  }
  return (
    <div class="mb-4">
      <h4>
        <i class="fe fe-radio mr-1" />
        <Text id="integration.externalIntegration.install.networkDiscoveryTitle" />
      </h4>
      <p class="text-muted small">
        <Text id="integration.externalIntegration.install.networkDiscoveryText" />
      </p>
      <ul class="mb-0">
        {networkDiscovery.map(capture => (
          <li>
            {capture.type === 'udp-broadcast' && (
              <Text
                id="integration.externalIntegration.networkDiscovery.udpBroadcastText"
                fields={{ ports: (capture.ports || []).join(', ') }}
              />
            )}
            {capture.type === 'udp-active-broadcast' && (
              <Text
                id="integration.externalIntegration.networkDiscovery.udpActiveBroadcastText"
                fields={{ ports: (capture.ports || []).join(', ') }}
              />
            )}
            {capture.type === 'mdns' && (
              <Text
                id="integration.externalIntegration.networkDiscovery.mdnsText"
                fields={{ service: capture.service }}
              />
            )}
            {capture.type === 'ssdp' && (
              <Text id="integration.externalIntegration.networkDiscovery.ssdpText" fields={{ st: capture.st }} />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default NetworkDiscoverySummary;
