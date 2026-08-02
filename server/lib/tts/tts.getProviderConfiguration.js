const { SYSTEM_VARIABLE_NAMES } = require('../../utils/constants');
const { GLADYS_PLUS_PROVIDER } = require('./constants');

/**
 * @description The TTS provider configuration for the frontend: the list
 * of available providers and the active one (TTS_ACTIVE_PROVIDER system
 * variable, Gladys Plus by default).
 * @returns {Promise<object>} Resolve with { active, providers }.
 * @example
 * const { active, providers } = await gladys.tts.getProviderConfiguration();
 */
async function getProviderConfiguration() {
  const active = (await this.variable.getValue(SYSTEM_VARIABLE_NAMES.TTS_ACTIVE_PROVIDER)) || GLADYS_PLUS_PROVIDER;
  return {
    active,
    providers: this.getProviders(),
  };
}

module.exports = {
  getProviderConfiguration,
};
