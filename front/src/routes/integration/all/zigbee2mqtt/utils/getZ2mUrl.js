import config from '../../../../../config';

/**
 * Resolve the Zigbee2mqtt frontend URL from setup configuration.
 * @param {object} setup - Setup from API or mapped configuration.
 * @param {boolean} [hasGatewayClient=false] - Whether Gladys Plus gateway client is active.
 * @returns {string|null}
 */
export default function getZ2mUrl(setup, hasGatewayClient = false) {
  const mqttMode = setup.mqttMode ?? setup.Z2M_MQTT_MODE;
  const frontendUrl = setup.z2mFrontendUrl ?? setup.Z2M_FRONTEND_URL;
  const tcpPort = setup.z2mTcpPort ?? setup.Z2M_TCP_PORT;

  if (mqttMode === 'external') {
    return frontendUrl || null;
  }

  if (mqttMode === 'local') {
    if (!hasGatewayClient) {
      const url = new URL(config.localApiUrl);
      return `${url.protocol}//${url.hostname}:${tcpPort || '8080'}`;
    }
  }

  return null;
}

/**
 * Whether to show the missing Z2M URL warning on device/discover pages.
 * @param {object} setup - Setup from API or mapped configuration.
 * @param {boolean} [hasGatewayClient=false] - Whether Gladys Plus gateway client is active.
 * @param {string|null} z2mUrl - Resolved Zigbee2mqtt frontend URL.
 * @returns {boolean}
 */
export function shouldShowZ2mUrlWarning(setup, hasGatewayClient = false, z2mUrl = null) {
  if (z2mUrl) {
    return false;
  }

  const mqttMode = setup.mqttMode ?? setup.Z2M_MQTT_MODE;
  return !(hasGatewayClient && mqttMode === 'local');
}
