const db = require('../../models');
const { SYSTEM_VARIABLE_NAMES } = require('../../utils/constants');
const { GLADYS_PLUS_PROVIDER } = require('./constants');

/**
 * @description The TTS provider configuration for the frontend: the list
 * of available providers and the active one (TTS_ACTIVE_PROVIDER system
 * variable, Gladys Plus by default). Each provider carries a display
 * name — the integration's manifest name when it has one — so the voice
 * card on the Artificial Intelligence integration page matches the
 * Integrations UI instead of showing raw selectors.
 * @returns {Promise<object>} Resolve with { active, providers }.
 * @example
 * const { active, providers } = await gladys.tts.getProviderConfiguration();
 */
async function getProviderConfiguration() {
  const active = (await this.variable.getValue(SYSTEM_VARIABLE_NAMES.TTS_ACTIVE_PROVIDER)) || GLADYS_PLUS_PROVIDER;
  const providers = this.getProviders();
  const externalProviderNames = providers
    .map(({ provider }) => provider)
    .filter((provider) => provider !== GLADYS_PLUS_PROVIDER);
  const displayNames = new Map();
  if (externalProviderNames.length > 0) {
    const services = await db.Service.findAll({
      where: { name: externalProviderNames },
      attributes: ['name', 'manifest'],
    });
    services.forEach((service) => {
      if (service.manifest && service.manifest.name) {
        displayNames.set(service.name, service.manifest.name);
      }
    });
  }
  return {
    active,
    providers: providers.map(({ provider }) => ({
      provider,
      name: provider === GLADYS_PLUS_PROVIDER ? 'Gladys Plus' : displayNames.get(provider) || provider,
    })),
  };
}

module.exports = {
  getProviderConfiguration,
};
