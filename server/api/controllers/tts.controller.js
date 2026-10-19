const asyncMiddleware = require('../middlewares/asyncMiddleware');

module.exports = function TtsController(gladys) {
  /**
   * @api {get} /api/v1/tts/provider Get TTS provider configuration
   * @apiName getProviderConfiguration
   * @apiGroup Tts
   * @apiSuccessExample {json} Success-Response:
   * { "active": "gladys-plus", "providers": [{ "provider": "gladys-plus" }] }
   */
  async function getProviderConfiguration(req, res) {
    const configuration = await gladys.tts.getProviderConfiguration();
    res.json(configuration);
  }

  /**
   * @api {post} /api/v1/tts/provider Set the active TTS provider
   * @apiName setActiveProvider
   * @apiGroup Tts
   * @apiParam {string} provider 'gladys-plus' or the selector of a service exposing tts.synthesize
   */
  async function setActiveProvider(req, res) {
    const configuration = await gladys.tts.setActiveProvider(req.body.provider);
    res.json(configuration);
  }

  /**
   * @api {get} /api/v1/tts/audio/:token Get a synthesized audio clip
   * @apiName getAudio
   * @apiGroup Tts
   * @apiDescription Unauthenticated by design: the URL is handed to a LAN
   * speaker (Sonos trackUri...) which cannot send a JWT — the high-entropy
   * token is the secret, scoped to this single short-lived clip. The token
   * may carry the extension derived from the audio content type (.mp3...),
   * kept in the URL so players can sniff the format.
   */
  async function getAudio(req, res) {
    const token = req.params.token.split('.')[0];
    const { buffer, contentType } = gladys.tts.getAudio(token);
    res.set('Content-Type', contentType);
    res.send(buffer);
  }

  return Object.freeze({
    getProviderConfiguration: asyncMiddleware(getProviderConfiguration),
    setActiveProvider: asyncMiddleware(setActiveProvider),
    getAudio: asyncMiddleware(getAudio),
  });
};
