/**
 * @description List the installed AI provider integrations (manifest type
 * "ai"): the candidates of the AI provider selection, next to the Gladys
 * Plus default.
 * @returns {Promise<Array>} Resolve with the list of AI providers.
 * @example
 * const providers = await gladys.externalIntegration.getAiProviders();
 */
async function getAiProviders() {
  const integrations = await this.get();
  return integrations
    .filter((integration) => integration.manifest && integration.manifest.type === 'ai')
    .map((integration) => ({
      selector: integration.selector,
      name: (integration.manifest && integration.manifest.name) || integration.name,
      status: integration.status,
    }));
}

module.exports = {
  getAiProviders,
};
