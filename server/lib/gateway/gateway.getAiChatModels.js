const { getAiChatModelsList } = require('../../utils/aiChatModels');
const { isOpenJarvisSelected } = require('../../utils/localAiProvider');

/**
 * @description Get the list of AI chat models available in the UI.
 * @returns {Promise<{ models: Array<{ id: string, vision: boolean }> }>} Allowed models.
 * @example
 * const { models } = await getAiChatModels();
 */
async function getAiChatModels() {
  return {
    models: isOpenJarvisSelected() ? [] : getAiChatModelsList(),
  };
}

module.exports = {
  getAiChatModels,
};
