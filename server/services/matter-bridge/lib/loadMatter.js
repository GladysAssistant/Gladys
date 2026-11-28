const logger = require('../../../utils/logger');

// matter.js logs at debug level by default, and at notice level it prints the setup passcode, the
// manual pairing code and the QR code each time an uncommissioned node goes online: the pairing
// secret, which only admins may read from the API, would end up in the Gladys logs. Only warnings
// and errors are kept.
const MATTER_LOG_LEVEL = 'warn';

/**
 * @description Keep only the warnings and errors of matter.js, and write them to the Gladys logs.
 * The copy of matter.js of this service is its own, so this leaves the logs of the Matter
 * controller of the `matter` service as they are.
 * @param {object} main - The @matter/main module.
 * @example
 * configureLogs(require('@matter/main'));
 */
function configureLogs(main) {
  const { Environment, Logger, LogLevel, LogFormat } = main;
  // matter.js applies these variables again each time one of them changes: setting them, rather
  // than the level alone, keeps them when the bridge sets its storage path.
  Environment.default.vars.set('log.level', MATTER_LOG_LEVEL);
  Environment.default.vars.set('log.format', LogFormat.PLAIN);
  Logger.level = MATTER_LOG_LEVEL;
  Logger.format = LogFormat.PLAIN;
  Logger.destinations.default.write = (text, message) => {
    if (message.level >= LogLevel.ERROR) {
      logger.error(`Matter bridge (matter.js): ${text}`);
    } else {
      logger.warn(`Matter bridge (matter.js): ${text}`);
    }
  };
}

/**
 * @description Load the matter.js modules. Gladys builds every service at start-up, so they are
 * not required when the service is built but when the bridge starts: matter.js sets up its Node.js
 * platform when it is loaded, which only an enabled bridge needs.
 * @returns {object} The matter.js modules: { main, devices, endpoints, behaviors, protocol }.
 * @example
 * const matter = loadMatter();
 */
function loadMatter() {
  const main = require('@matter/main');
  configureLogs(main);
  return {
    main,
    // eslint-plugin-import does not read the "exports" map these sub-paths are declared in.
    // eslint-disable-next-line import/no-unresolved
    devices: require('@matter/main/devices'),
    // eslint-disable-next-line import/no-unresolved
    endpoints: require('@matter/main/endpoints'),
    // eslint-disable-next-line import/no-unresolved
    behaviors: require('@matter/main/behaviors'),
    // eslint-disable-next-line import/no-unresolved
    protocol: require('@matter/main/protocol'),
  };
}

module.exports = {
  MATTER_LOG_LEVEL,
  configureLogs,
  loadMatter,
};
