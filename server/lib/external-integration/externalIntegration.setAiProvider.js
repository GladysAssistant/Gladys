const { BadParameters } = require('../../utils/coreErrors');
const { SYSTEM_VARIABLE_NAMES } = require('../../utils/constants');

/**
 * @description Select the AI provider of the instance. A null selector
 * resets to the Gladys Plus default (variable destroyed); otherwise the
 * selector must be an installed integration of manifest type "ai"
 * (unknown selector -> NotFoundError from getBySelector, installed but not
 * an AI provider -> BadParameters).
 * @param {string|null} selector - The selector of the AI provider
 * integration, or null to reset to Gladys Plus.
 * @returns {Promise<string|null>} Resolve with the persisted selector.
 * @example
 * await gladys.externalIntegration.setAiProvider('ext-dev-my-ai-provider');
 */
async function setAiProvider(selector) {
  if (selector === null) {
    await this.variable.destroy(SYSTEM_VARIABLE_NAMES.AI_PROVIDER);
    return null;
  }
  const service = await this.getBySelector(selector);
  if (!service.manifest || service.manifest.type !== 'ai') {
    throw new BadParameters(`External integration ${selector} is not an AI provider`);
  }
  await this.variable.setValue(SYSTEM_VARIABLE_NAMES.AI_PROVIDER, service.selector);
  return service.selector;
}

module.exports = {
  setAiProvider,
};
