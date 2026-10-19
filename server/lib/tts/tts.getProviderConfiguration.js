const db = require('../../models');
const { GLADYS_PLUS_PROVIDER } = require('./constants');

/**
 * @description The TTS provider configuration for the frontend: the list
 * of available providers and the active one (TTS_ACTIVE_PROVIDER system
 * variable, Gladys Plus by default). Each provider carries a display
 * name — the integration's manifest name when it has one — so the voice
 * card on the Artificial Intelligence integration page matches the
 * Integrations UI instead of showing raw selectors; an integration provider
 * also carries its selector (link to its page) and its service status, so
 * the card can warn when the selected voice is stopped.
 * @returns {Promise<object>} Resolve with { active, providers }.
 * @example
 * const { active, providers } = await gladys.tts.getProviderConfiguration();
 */
async function getProviderConfiguration() {
  const active = await this.getActiveProvider();
  const providers = this.getProviders();
  const externalProviderNames = providers
    .map(({ provider }) => provider)
    .filter((provider) => provider !== GLADYS_PLUS_PROVIDER);
  const servicesByName = new Map();
  if (externalProviderNames.length > 0) {
    const services = await db.Service.findAll({
      where: { name: externalProviderNames },
      attributes: ['name', 'selector', 'manifest', 'status'],
    });
    services.forEach((service) => servicesByName.set(service.name, service));
  }
  return {
    active,
    providers: providers.map(({ provider }) => {
      if (provider === GLADYS_PLUS_PROVIDER) {
        return { provider, name: 'Gladys Plus' };
      }
      const service = servicesByName.get(provider);
      return {
        provider,
        name: (service && service.manifest && service.manifest.name) || provider,
        selector: (service && service.selector) || provider,
        status: (service && service.status) || null,
      };
    }),
  };
}

module.exports = {
  getProviderConfiguration,
};
