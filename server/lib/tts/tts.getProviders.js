const { GLADYS_PLUS_PROVIDER } = require('./constants');

/**
 * @description List the available TTS providers: the built-in Gladys Plus
 * provider, then every stateManager service exposing tts.synthesize (the
 * forwardToChannels pattern: external "tts" integrations and possible
 * future internal services all go through this same interface, the core
 * knows no engine by name).
 * @returns {Array} The list of providers.
 * @example
 * const providers = gladys.tts.getProviders();
 */
function getProviders() {
  const providers = [{ provider: GLADYS_PLUS_PROVIDER }];
  const serviceNames = this.stateManager.getAllKeys('service');
  serviceNames.forEach((serviceName) => {
    const service = this.service.getService(serviceName);
    if (service && service.tts && typeof service.tts.synthesize === 'function') {
      providers.push({ provider: serviceName });
    }
  });
  return providers;
}

module.exports = {
  getProviders,
};
