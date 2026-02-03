const fs = require('fs/promises');
const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');

module.exports = function GradiumController(gradiumHandler) {
  /**
   * @api {get} /api/v1/service/gradium/speech-file/:uuid-file Gradium TTS speech URL
   * @apiName speechFile
   * @apiGroup Gradium
   */
  async function speechFile(req, res) {
    const { uuid } = req.params;
    // validate with regexp that uuid is a valid uuid.ogg
    if (!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\.ogg$/.test(uuid)) {
      return res.status(400).json({ error: 'Invalid UUID' });
    }

    // return associated file
    const dockerBased = await gradiumHandler.gladys.system.isDocker();
    let basePath = 'gradium';
    if (dockerBased) {
      const { basePathOnContainer } = await gradiumHandler.gladys.system.getGladysBasePath();
      basePath = `${basePathOnContainer}/${basePath}`;
    }
    const fileData = await fs.readFile(`${basePath}/${uuid}`);
    res.setHeader('Content-Type', 'audio/ogg');
    return res.send(fileData);
  }

  return {
    'get /api/v1/service/gradium/speech-file/:uuid': {
      controller: asyncMiddleware(speechFile),
    },
  };
};
