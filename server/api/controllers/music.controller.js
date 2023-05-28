const { WEBSOCKET_MESSAGE_TYPES, EVENTS, SYSTEM_VARIABLE_NAMES, MUSIC } = require('../../utils/constants');
const asyncMiddleware = require('../middlewares/asyncMiddleware');

module.exports = function MusicController(gladys) {
  /**
   * @api {get} /api/v1/music/providers Returns list of music provider (=service) enabled.
   * @apiName getProviders
   * @apiGroup Music
   */
  async function getProviders(req, res) {
    const result = [];
    const providerEnabled = await gladys.variable.getValue(SYSTEM_VARIABLE_NAMES.GLADYS_MUSIC_SERVICES_ENABLED);
    if (providerEnabled) {
      const providerEnabledJson = JSON.parse(providerEnabled);
      Object.keys(providerEnabledJson).forEach((key) => {
        if (providerEnabledJson[key] === MUSIC.PROVIDER.STATUS.ENABLED) {
          result.push(key);
        }
      });
    }

    res.json({
      providers: result,
    });
  }

  /**
   * @api {get} /api/v1/music/:service_name Returns status of provider(=service).
   * @apiName getProviderStatus
   * @apiGroup Music
   */
  async function getProviderStatus(req, res) {
    const serviceName = req.params.service_name;
    const providerEnabled = await gladys.variable.getValue(SYSTEM_VARIABLE_NAMES.GLADYS_MUSIC_SERVICES_ENABLED);
    let status = MUSIC.PROVIDER.STATUS.DISABLED;
    if (providerEnabled) {
      const providerEnabledHson = JSON.parse(providerEnabled);
      if (providerEnabledHson[serviceName]) {
        status = providerEnabledHson[serviceName];
      }
    }

    res.json({
      status,
    });
  }

  /**
   * @api {post} /api/v1/music/:service_name/:status Enable/Disable music provider (=service) by service-name
   * @apiName changeProviderStatus
   * @apiGroup Music
   */
  async function changeProviderStatus(req, res) {
    const serviceName = req.params.service_name;
    const providerStatus = req.params.status;
    if (serviceName) {
      const providerEnabled = await gladys.variable.getValue(SYSTEM_VARIABLE_NAMES.GLADYS_MUSIC_SERVICES_ENABLED);
      const newProviderEnabled = providerEnabled ? JSON.parse(providerEnabled) : {};
      newProviderEnabled[serviceName] = providerStatus;
      gladys.variable.setValue(SYSTEM_VARIABLE_NAMES.GLADYS_MUSIC_SERVICES_ENABLED, JSON.stringify(newProviderEnabled));
    }

    res.json({});
  }

  /**
   * @api {get} /api/v1/music/stop/:provider/:speaker_output_name Stop music
   *  with provider (=service) and speaker requested.
   * @apiName stop
   * @apiGroup Music
   */
  async function stop(req, res) {
    const { provider } = req.params;
    const speakerOutputName = req.params.speaker_output_name;

    if (speakerOutputName && provider) {
      gladys.event.emit(WEBSOCKET_MESSAGE_TYPES.MUSIC.STOP, {
        eventType: EVENTS.MUSIC.STOP,
        provider,
        speakerOutputName,
      });
    }

    res.json({});
  }

  /**
   * @api {get} /api/v1/music/pause/:provider/:speaker_output_name
   *  Pause music with provider (=service) and speaker requested.
   * @apiName pause
   * @apiGroup Music
   */
  async function pause(req, res) {
    const { provider, providerType } = req.params;
    const speakerOutputName = req.params.speaker_output_name;

    if (speakerOutputName && provider && provider) {
      gladys.event.emit(WEBSOCKET_MESSAGE_TYPES.MUSIC.PAUSE, {
        eventType: EVENTS.MUSIC.PAUSE,
        provider,
        speakerOutputName,
        providerType,
      });
    }

    res.json({});
  }

  /**
   * @api {get} /api/v1/music/mute/:provider/:speaker_output_name
   *  Mute/Unmute music with provider (=service) and speaker requested.
   * @apiName mute
   * @apiGroup Music
   */
  async function mute(req, res) {
    const { provider } = req.params;
    const speakerOutputName = req.params.speaker_output_name;

    if (speakerOutputName && provider && provider) {
      gladys.event.emit(WEBSOCKET_MESSAGE_TYPES.MUSIC.MUTE, {
        eventType: EVENTS.MUSIC.MUTE,
        provider,
        speakerOutputName,
      });
    }

    res.json({});
  }

  /**
   * @api {get} /api/v1/music/volume/:provider/:speaker_output_name/:volume
   *  Change volume of music with provider (=service) and speaker requested.
   * @apiName volume
   * @apiGroup Music
   */
  async function volume(req, res) {
    const { provider, providerType } = req.params;
    const newVolume = req.params.volume;
    const speakerOutputName = req.params.speaker_output_name;

    if (speakerOutputName && provider && newVolume) {
      gladys.event.emit(WEBSOCKET_MESSAGE_TYPES.MUSIC.VOLUME, {
        eventType: EVENTS.MUSIC.VOLUME,
        provider,
        speakerOutputName,
        providerType,
        volumeLevel: newVolume,
      });
    }

    res.json({});
  }

  return Object.freeze({
    getProviders: asyncMiddleware(getProviders),
    getProviderStatus: asyncMiddleware(getProviderStatus),
    changeProviderStatus: asyncMiddleware(changeProviderStatus),
    stop: asyncMiddleware(stop),
    pause: asyncMiddleware(pause),
    mute: asyncMiddleware(mute),
    volume: asyncMiddleware(volume),
  });
};
