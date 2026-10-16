const { SYSTEM_VARIABLE_NAMES } = require('../../utils/constants');
const { GLADYS_PLUS_PROVIDER } = require('./constants');

/**
 * @description The id of the active TTS provider: the TTS_ACTIVE_PROVIDER
 * system variable, Gladys Plus when it is not set. The single place that
 * reads the variable — the dispatcher, the configuration endpoint and the
 * consumers deciding what a failure means all go through it.
 * @returns {Promise<string>} Resolve with 'gladys-plus' or a service selector.
 * @example
 * const provider = await gladys.tts.getActiveProvider();
 */
async function getActiveProvider() {
  return (await this.variable.getValue(SYSTEM_VARIABLE_NAMES.TTS_ACTIVE_PROVIDER)) || GLADYS_PLUS_PROVIDER;
}

module.exports = {
  getActiveProvider,
};
