const { getAiChatModelsList } = require('../../utils/aiChatModels');

/**
 * @description Get the list of AI chat models available in the UI.
 * @returns {Promise<{ models: Array<{ id: string, vision: boolean }> }>} Allowed models.
 * @example
 * const { models } = await getAiChatModels();
 */
async function getAiChatModels() {
  return {
    models: getAiChatModelsList(),
  };
}

module.exports = {
  getAiChatModels,
};
