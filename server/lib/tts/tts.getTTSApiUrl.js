/**
 * @description Get the TTS media URL.
 * @param {object} body - The request body.
 * @param {string} body.service - The tts service to use.
 * @returns {Promise} Resolve with url.
 * @example
 * getTTSApiUrl({ text: 'Blabla' });
 */
async function getTTSApiUrl({ service, ...body }) {
  let url = '';

  // Gradium
  const gradiumService = this.service.getService('gradium');
  if (gradiumService && service === 'gradium') {
    url = await gradiumService.tts.getTTSApiUrl(body);
  }

  // Use Gateway TTS if url is still empty
  if (url === '') {
    ({ url } = await this.gateway.getTTSApiUrl(body));
  }

  return url;
}

module.exports = {
  getTTSApiUrl,
};
