/**
 * @description Whether Bobs Home uses its local OpenJarvis inference bridge.
 * @returns {boolean} Whether the local provider is selected.
 * @example
 * isOpenJarvisSelected();
 */
function isOpenJarvisSelected() {
  return process.env.BOBS_HOME_AI_PROVIDER === 'openjarvis';
}

module.exports = { isOpenJarvisSelected };
