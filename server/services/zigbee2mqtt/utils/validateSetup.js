const { BadParameters } = require('../../../utils/coreErrors');
const { CONFIGURATION, ADAPTER_MODE } = require('../lib/constants');
const { CONFIG_KEYS } = require('../adapters');

// tcp://<host>:<port>, the only serial port format Zigbee2mqtt accepts for a network coordinator
const NETWORK_ADAPTER_URL_REGEX = /^tcp:\/\/([a-zA-Z0-9][a-zA-Z0-9._-]*):(\d{1,5})$/;

/**
 * @description Validate and normalize the network coordinator URL entered by the user.
 * @param {string} url - Raw URL, with or without the "tcp://" prefix.
 * @returns {string} The normalized "tcp://<host>:<port>" URL.
 * @example
 * const url = normalizeNetworkAdapterUrl('192.168.1.20:6638');
 */
function normalizeNetworkAdapterUrl(url) {
  if (typeof url !== 'string' || url.trim().length === 0) {
    throw new BadParameters('Zigbee2mqtt: network coordinator URL is required');
  }

  const trimmedUrl = url.trim();
  const urlWithScheme = trimmedUrl.includes('://') ? trimmedUrl : `tcp://${trimmedUrl}`;
  const matches = NETWORK_ADAPTER_URL_REGEX.exec(urlWithScheme);

  if (matches === null) {
    throw new BadParameters(
      `Zigbee2mqtt: network coordinator URL "${url}" is invalid, expected format is "tcp://<host>:<port>"`,
    );
  }

  const [, host, port] = matches;
  const portNumber = Number(port);
  if (portNumber < 1 || portNumber > 65535) {
    throw new BadParameters(`Zigbee2mqtt: network coordinator port "${port}" should be between 1 and 65535`);
  }

  return `tcp://${host}:${portNumber}`;
}

/**
 * @description Validate the setup sent by the user, and normalize the network coordinator settings.
 * @param {object} config - Setup variables sent by the user.
 * @returns {object} The validated setup variables.
 * @example
 * const config = validateSetup({ Z2M_ADAPTER_MODE: 'network', Z2M_NETWORK_ADAPTER_URL: '192.168.1.20:6638' });
 */
function validateSetup(config) {
  const adapterMode = config[CONFIGURATION.Z2M_ADAPTER_MODE];

  if (adapterMode === undefined || adapterMode === null) {
    return config;
  }

  if (!Object.values(ADAPTER_MODE).includes(adapterMode)) {
    throw new BadParameters(
      `Zigbee2mqtt: adapter mode "${adapterMode}" is invalid, expected one of ${Object.values(ADAPTER_MODE).join(
        ', ',
      )}`,
    );
  }

  if (adapterMode !== ADAPTER_MODE.NETWORK) {
    return config;
  }

  const adapterType = config[CONFIGURATION.Z2M_NETWORK_ADAPTER_TYPE];
  if (!Object.values(CONFIG_KEYS).includes(adapterType)) {
    throw new BadParameters(
      `Zigbee2mqtt: network coordinator type "${adapterType}" is invalid, expected one of ${Object.values(
        CONFIG_KEYS,
      ).join(', ')}`,
    );
  }

  return {
    ...config,
    [CONFIGURATION.Z2M_NETWORK_ADAPTER_URL]: normalizeNetworkAdapterUrl(config[CONFIGURATION.Z2M_NETWORK_ADAPTER_URL]),
  };
}

module.exports = {
  validateSetup,
};
