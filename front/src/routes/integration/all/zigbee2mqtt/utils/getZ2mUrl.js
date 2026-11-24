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
  const authToken = setup.z2mFrontendAuthToken ?? setup.Z2M_FRONTEND_AUTH_TOKEN;

  if (mqttMode === 'external') {
    return frontendUrl || null;
  }

  if (mqttMode === 'local') {
    if (!hasGatewayClient) {
      const url = new URL(config.localApiUrl);
      // The interface reads its password from the address of the page, without asking for it
      const query = authToken ? `/?token=${encodeURIComponent(authToken)}` : '';
      return `${url.protocol}//${url.hostname}:${tcpPort || '8080'}${query}`;
    }
  }

  return null;
}

/**
 * Address of a device in the Zigbee2mqtt frontend: its page after the query, which may carry the password of the
 * interface (`?token=`).
 * @param {string} z2mUrl - Resolved Zigbee2mqtt frontend URL.
 * @param {string} ieeeAddress - IEEE address of the device.
 * @returns {string}
 */
export function getZ2mDeviceUrl(z2mUrl, ieeeAddress) {
  const devicePath = `#/device/0/${ieeeAddress}/info`;
  try {
    const url = new URL(z2mUrl);
    // As before the query: the page of the device below the path of the interface
    if (!url.pathname.endsWith('/')) {
      url.pathname = `${url.pathname}/`;
    }
    url.hash = devicePath;
    return url.toString();
  } catch (e) {
    // An interface URL typed by hand that is not one: linked as is
    return `${z2mUrl}/${devicePath}`;
  }
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
