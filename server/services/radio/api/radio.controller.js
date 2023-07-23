const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');
const { RADIO } = require('../lib/utils/radio.constants');

module.exports = function RadioController(radioHandler) {
  /**
   * @api {get} /api/v1/service/radio/playlists Returns list of station by default country.
   * @apiName getPlaylists
   * @apiGroup Music
   */
  async function getPlaylists(req, res) {
    const result = await radioHandler.getStationsByCountry();

    res.json({
      success: true,
      provider: RADIO.SERVICE_NAME,
      playlists: result,
    });
  }

  /**
   * @api {get} /api/v1/service/radio/countries Returns list of available radio country.
   * @apiName getAvailableCountry
   * @apiGroup Music
   */
  async function getAvailableCountry(req, res) {
    const result = await radioHandler.getAvailableCountry();

    res.json({
      success: true,
      provider: RADIO.SERVICE_NAME,
      available_country: result,
    });
  }

  /**
   * @api {get} /api/v1/service/radio/stations/:country Returns list of stations for a country.
   * @apiName getStationsByCountry
   * @apiGroup Music
   */
  async function getStationsByCountry(req, res) {
    const { country } = req.params;

    let stations = [];
    if (country) {
      stations = await radioHandler.getStationsByCountry(country);
    }

    res.json({
      stations,
    });
  }

  /**
   * @api {get} /api/v1/service/radio/station/default Returns default station details.
   * @apiName getDefaultStation
   * @apiGroup Music
   */
  async function getDefaultStation(req, res) {
    let result;
    const station = await radioHandler.getStationByStationUUID();
    if (station) {
      result = {
        value: station.stationuuid,
        label: station.name,
        url: station.url,
        cover: station.favicon,
      };
    }

    res.json({
      station: result,
    });
  }

  /**
   * @api {get} /api/v1/service/radio/capabilities Returns list of capabilities on music provider.
   * @apiName getCapabilities
   * @apiGroup Music
   */
  async function getCapabilities(req, res) {
    const result = radioHandler.getCapabilities();
    res.json(result);
  }

  /**
   * @api {get} /api/v1/service/radio/play/:speaker_output_name/:playlist/:volume Play
   *    music with provider and playlist requested.
   * @apiName play
   * @apiGroup Music
   */
  async function play(req, res) {
    const { playlist, volume } = req.params;
    const speakerOutputName = req.params.speaker_output_name;

    if (speakerOutputName && playlist) {
      radioHandler.play(speakerOutputName, playlist, volume);
    }

    res.json({
      success: true,
    });
  }

  return {
    'get /api/v1/service/radio/playlists': {
      authenticated: true,
      admin: true,
      controller: asyncMiddleware(getPlaylists),
    },
    'get /api/v1/service/radio/countries': {
      authenticated: true,
      admin: true,
      controller: asyncMiddleware(getAvailableCountry),
    },
    'get /api/v1/service/radio/stations/:country': {
      authenticated: true,
      admin: true,
      controller: asyncMiddleware(getStationsByCountry),
    },
    'get /api/v1/service/radio/station/default': {
      authenticated: true,
      admin: true,
      controller: asyncMiddleware(getDefaultStation),
    },
    'get /api/v1/service/radio/capabilities': {
      authenticated: true,
      admin: true,
      controller: asyncMiddleware(getCapabilities),
    },
    'get /api/v1/service/radio/play/:speaker_output_name/:playlist/:volume': {
      authenticated: true,
      admin: true,
      controller: asyncMiddleware(play),
    },
  };
};
