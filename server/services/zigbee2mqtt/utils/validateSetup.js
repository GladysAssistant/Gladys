const { BadParameters } = require('../../../utils/coreErrors');
const { CONFIGURATION, ADAPTER_MODE } = require('../lib/constants');
const { CONFIG_KEYS } = require('../adapters');

// tcp://<host>:<port>, the serial port format Zigbee2mqtt expects for a network coordinator
const NETWORK_ADAPTER_URL_REGEX = /^tcp:\/\/([a-zA-Z0-9][a-zA-Z0-9._-]*):(\d{1,5})$/;
// mdns://<service>, when Zigbee2mqtt discovers the coordinator itself over Zeroconf (no port)
const MDNS_ADAPTER_URL_REGEX = /^mdns:\/\/([a-zA-Z0-9][a-zA-Z0-9._-]*)$/;
// "socket://" is the alias used by the coordinator documentations (SMLIGHT/ZHA) for the same TCP URL
const TCP_SCHEMES = ['tcp', 'socket'];

/**
 * @description Validate and normalize the network coordinator URL entered by the user.
 * @param {string} url - Raw URL, with or without a "tcp://", "socket://" or "mdns://" prefix.
 * @returns {string} The normalized "tcp://<host>:<port>" or "mdns://<service>" URL.
 * @example
 * const url = normalizeNetworkAdapterUrl('192.168.1.20:6638');
 */
function normalizeNetworkAdapterUrl(url) {
  if (typeof url !== 'string' || url.trim().length === 0) {
    throw new BadParameters('Zigbee2mqtt: network coordinator URL is required');
  }

  // Users copy-paste the URL from their coordinator documentation, so tolerate an uppercase
  // scheme and a trailing slash: they designate the same coordinator
  const trimmedUrl = url.trim();
  const urlWithScheme = trimmedUrl.includes('://') ? trimmedUrl : `tcp://${trimmedUrl}`;
  const separatorIndex = urlWithScheme.indexOf('://');
  const scheme = urlWithScheme.slice(0, separatorIndex).toLowerCase();
  const address = urlWithScheme.slice(separatorIndex + 3).replace(/\/+$/, '');

  if (scheme === 'mdns') {
    if (MDNS_ADAPTER_URL_REGEX.exec(`mdns://${address}`) === null) {
      throw new BadParameters(
        `Zigbee2mqtt: network coordinator URL "${url}" is invalid, expected format is "mdns://<service>"`,
      );
    }

    return `mdns://${address}`;
  }

  if (!TCP_SCHEMES.includes(scheme)) {
    throw new BadParameters(
      `Zigbee2mqtt: network coordinator scheme "${scheme}" is invalid, expected one of ${TCP_SCHEMES.join(', ')}, mdns`,
    );
  }

  const matches = NETWORK_ADAPTER_URL_REGEX.exec(`tcp://${address}`);

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
