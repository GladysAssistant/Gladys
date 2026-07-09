const fs = require('fs/promises');
const { randomUUID } = require('crypto');
const logger = require('../../../utils/logger');

/**
 * @description Generate a TTS audio file and return local URL.
 * @param {object} body - Body content.
 * @param {string} body.text - The text to convert to speech.
 * @returns {Promise} Resolve with OpenAI response.
 * @example
 * getTTSApiUrl({ text: 'Blabla' })
 */
async function getTTSApiUrl({ text }) {
  const gradiumEndpoint = await this.gladys.variable.getValue('GRADIUM_ENDPOINT', this.serviceId);
  const gradiumApiKey = await this.gladys.variable.getValue('GRADIUM_API_KEY', this.serviceId);
  const gradiumVoiceId = await this.gladys.variable.getValue('GRADIUM_VOICE_ID', this.serviceId);
  let filePath;

  try {
    const response = await this.gladys.http.request(
      'post',
      `https://${gradiumEndpoint}.api.gradium.ai/api/post/speech/tts`,
      {
        text,
        voice_id: gradiumVoiceId,
        output_format: 'opus',
        only_audio: true,
      },
      {
        'x-api-key': gradiumApiKey,
        'Content-Type': 'application/json',
      },
      'arraybuffer',
    );

    const uuid = randomUUID();

    // save as file with an uuid as name
    const dockerBased = await this.gladys.system.isDocker();
    let { basePath } = this;
    if (dockerBased) {
      const { basePathOnContainer } = await this.gladys.system.getGladysBasePath();
      basePath = `${basePathOnContainer}/${basePath}`;
    }

    filePath = `${basePath}/${uuid}.ogg`;
    await fs.mkdir(basePath, { recursive: true });
    await fs.writeFile(filePath, response.data, {});

    // send the file url with path /api/v1/service/gradium/speech-url
    const { network_interfaces: networkInterfaces } = await this.gladys.system.getInfos();
    const { address: localIp } = Object.values(networkInterfaces)
      .flat()
      .find((iface) => {
        if (iface.family === 'IPv4' && !iface.internal) {
          return true;
        }

        return false;
      });

    return `http://${localIp}${
      process.env.NODE_ENV === 'production' ? '' : `:${process.env.PORT || 1443}`
    }/api/v1/service/gradium/speech-file/${uuid}.ogg`;
  } catch (e) {
    logger.warn('Gradium TTS request failed', e.message);

    if (filePath) {
      await fs.rm(filePath).catch(() => {});
    }

    return '';
  }
}

module.exports = {
  getTTSApiUrl,
};
