/**
 * @description Get the TTS media URL.
 * @param {object} body - The request body.
 * @returns {Promise} Resolve with url.
 * @example
 * getTTSApiUrl({ text: 'Blabla' });
 */
async function getTTSApiUrl(body) {
  let url = '';

  // Gradium
  const gradiumService = this.service.getService('gradium');
  if (gradiumService) {
    url = await gradiumService.tts.getTTSApiUrl(body);
  }

  // Use Gateway TTS if url is still empty
  if (url === '') {
    ;({ url } = await this.gateway.getTTSApiUrl(body));
  }

  return url;
}

module.exports = {
  getTTSApiUrl,
};
