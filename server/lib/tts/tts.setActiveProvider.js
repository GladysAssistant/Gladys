const { Error422 } = require('../../utils/httpErrors');
const { SYSTEM_VARIABLE_NAMES } = require('../../utils/constants');

/**
 * @description Set the active TTS provider of the instance. The value must
 * be 'gladys-plus' or the name of a service currently exposing
 * tts.synthesize — an arbitrary value would only surface later as a
 * broken scene action.
 * @param {string} provider - The provider to activate.
 * @returns {Promise<object>} Resolve with the new provider configuration.
 * @example
 * await gladys.tts.setActiveProvider('gladys-plus');
 */
async function setActiveProvider(provider) {
  const providers = this.getProviders();
  const known = providers.some((availableProvider) => availableProvider.provider === provider);
  if (!known) {
    throw new Error422(`TTS provider "${provider}" is not available`);
  }
  await this.variable.setValue(SYSTEM_VARIABLE_NAMES.TTS_ACTIVE_PROVIDER, provider);
  return this.getProviderConfiguration();
}

module.exports = {
  setActiveProvider,
};
