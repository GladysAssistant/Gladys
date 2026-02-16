const logger = require('../../../utils/logger');

/**
 * @description List available voices on Gradium.
 * @returns {Promise} Resolve with an array of voice objects.
 * @example
 * getVoices()
 */
async function getVoices() {
  const gradiumEndpoint = await this.gladys.variable.getValue('GRADIUM_ENDPOINT', this.serviceId);
  const gradiumApiKey = await this.gladys.variable.getValue('GRADIUM_API_KEY', this.serviceId);

  try {
    const response = await this.gladys.http.request(
      'get',
      `https://${gradiumEndpoint}.api.gradium.ai/api/voices?include_catalog=true&limit=500`,
      {},
      {
        'x-api-key': gradiumApiKey,
        'Content-Type': 'application/json',
      },
    );

    return response.data.map((voice) => ({
      id: voice.uid,
      name: voice.name,
      description: voice.description,
      language: voice.language,
    }));
  } catch (e) {
    logger.warn(e);

    return [];
  }
}

module.exports = {
  getVoices,
};
