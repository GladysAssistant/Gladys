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
  const gradiumApiKey = await this.gladys.variable.getValue('GRADIUM_API_KEY', this.serviceId);
  try {
    const response = await this.gladys.http.request(
      'post',
      `https://eu.api.gradium.ai/api/post/speech/tts`,
      {
        text,
        voice_id: 'zIGaffB0kKEBG_8u',
        output_format: 'opus',
        only_audio: true
      },
      {
        'x-api-key': gradiumApiKey,
        'Content-Type': 'application/json'
      },
      'arraybuffer'
    );

    const uuid = randomUUID();

    // save as file with an uuid as name
    const dockerBased = await this.gladys.system.isDocker();
    let basePath = 'gradium';
    if (dockerBased) {
      const { basePathOnContainer } = await this.gladys.system.getGladysBasePath();
      basePath = `${basePathOnContainer}/${basePath}`;
    }
    await fs.mkdir(basePath, { recursive: true });
    await fs.writeFile(`${basePath}/${uuid}.ogg`, response.data, {});

    // send the file url with path /api/v1/service/gradium/speech-url
    const { network_interfaces: networkInterfaces } = await this.gladys.system.getInfos();
    const { address: localIp } = Object.values(networkInterfaces).flat().find((iface) => {
      if (iface.family === 'IPv4' && !iface.internal) {
        return true;
      }

      return false;
    });

    return `http://${localIp}${process.env.NODE_ENV === 'production' ? '' : `:${process.env.PORT || 1443}`}/api/v1/service/gradium/speech-file/${uuid}.ogg`;
  } catch (e) {
    logger.warn(e);

    return '';
  }
}

module.exports = {
  getTTSApiUrl,
};
