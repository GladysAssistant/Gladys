/**
 * @apiDefine televisionParam
 * @apiParam {Integer} [devicetype] DeviceType ID
 * @apiParam {Integer} [room] Room ID
 * @apiDescription You can put the devicetype attribute OR the room attribute to determine in which room you want to control the television/which precise deviceType is playing.
 */

module.exports = {
  /**
   * @api {post} /television/:id/state switch state
   * @apiName televisionSwitchState
   * @apiGroup television
   * @apiPermission authenticated
   *
   * @apiUse televisionParam
   */
  switchState: function(req, res, next) {
    gladys.television
      .switchState(req.body)
      .then(result => res.json(result))
      .catch(next);
  },

  /**
   * @api {get} /television/state Get Current State
   * @apiName televisionGetCurrentState
   * @apiGroup television
   * @apiPermission authenticated
   *
   * @apiUse televisionParam
   *
   * @apiSuccess {Boolean} state State of the television
   */
  getState: function(req, res, next) {
    gladys.television
      .getState({ device: req.params.id })
      .then(result => res.json(result))
      .catch(next);
  },

  /**
   * @api {post} /television/:id/channel Set channel
   * @apiName televisionSetChannel
   * @apiGroup television
   * @apiPermission authenticated
   *
   * @apiUse televisionParam
   *
   */
  setChannel: function(req, res, next) {
    gladys.television
      .setChannel(req.body)
      .then(result => res.json(result))
      .catch(next);
  },

  /**
   * @api {get} /television/channel Get channel
   * @apiName televisionGetChannel
   * @apiGroup television
   * @apiPermission authenticated
   *
   * @apiUse televisionParam
   *
   * @apiSuccess {Integer} channel Current channel of the television
   *
   */
  getChannel: function(req, res, next) {
    gladys.television
      .getChannel({ device: req.params.id })
      .then(result => res.json(result))
      .catch(next);
  },

  /**
   * @api {get} /television/mute Get Muted
   * @apiName televisionGetMuted
   * @apiGroup television
   * @apiPermission authenticated
   *
   * @apiUse televisionParam
   *
   * @apiSuccess {boolean} muted Returns true if the television is muted
   */
  getMuted: function(req, res, next) {
    gladys.television
      .getMuted({ device: req.params.id })
      .then(result => res.json(result))
      .catch(next);
  },

  /**
   * @api {get} /television/volume Get Volume
   * @apiName televisionGetVolume
   * @apiGroup television
   * @apiPermission authenticated
   *
   * @apiUse televisionParam
   *
   * @apiSuccess {integer} volume Volume of the television
   */
  getVolume: function(req, res, next) {
    gladys.television
      .getVolume({ device: req.params.id })
      .then(result => res.json(result))
      .catch(next);
  },

  /**
   * @api {post} /television/fastforward Fast Forward
   * @apiName televisionFastForward
   * @apiGroup television
   * @apiPermission authenticated
   *
   * @apiUse televisionParam
   */
  fastForward: function(req, res, next) {
    gladys.television
      .fastForward(req.body)
      .then(result => res.json(result))
      .catch(next);
  },

  /**
   * @api {post} /television/rewind Rewind
   * @apiName televisionRewind
   * @apiGroup television
   * @apiPermission authenticated
   *
   * @apiUse televisionParam
   */
  rewind: function(req, res, next) {
    gladys.television
      .rewind(req.body)
      .then(result => res.json(result))
      .catch(next);
  },

  /**
   * @api {post} /television/pause Pause
   * @apiName televisionPause
   * @apiGroup television
   * @apiPermission authenticated
   *
   * @apiUse televisionParam
   */
  pause: function(req, res, next) {
    gladys.television
      .pause(req.body)
      .then(result => res.json(result))
      .catch(next);
  },

  /**
   * @api {post} /television/play Play
   * @apiName televisionPlay
   * @apiGroup television
   * @apiPermission authenticated
   *
   * @apiUse televisionParam
   */
  play: function(req, res, next) {
    gladys.television
      .play(req.body)
      .then(result => res.json(result))
      .catch(next);
  },

  /**
   * @api {post} /television/:id/mute Set muted
   * @apiName televisionSetMuted
   * @apiGroup television
   * @apiPermission authenticated
   *
   * @apiUse televisionParam
   * @apiParam {boolean} muted true if sound is muted
   */
  setMuted: function(req, res, next) {
    gladys.television
      .setMuted(req.body)
      .then(result => res.json(result))
      .catch(next);
  },

  /**
   * @api {post} /television/volume Set Volume
   * @apiName televisionSetVolume
   * @apiGroup television
   * @apiPermission authenticated
   *
   * @apiUse televisionParam
   * @apiParam {integer} volume Volume level
   */
  setVolume: function(req, res, next) {
    gladys.television
      .setVolume(req.body)
      .then(result => res.json(result))
      .catch(next);
  },

  /**
   * @api {post} /television/stop Stop
   * @apiName televisionStop
   * @apiGroup television
   * @apiPermission authenticated
   *
   * @apiUse televisionParam
   */
  stop: function(req, res, next) {
    gladys.television
      .stop(req.body)
      .then(result => res.json(result))
      .catch(next);
  },

  /**
   * @api {post} /television/volume/up Volume Up
   * @apiName televisionVolumeUp
   * @apiGroup television
   * @apiPermission authenticated
   *
   * @apiUse televisionParam
   */
  volumeUp: function(req, res, next) {
    gladys.television
      .volumeUp(req.body)
      .then(result => res.json(result))
      .catch(next);
  },

  /**
   * @api {post} /television/volume/down Volume Down
   * @apiName televisionVolumeDown
   * @apiGroup television
   * @apiPermission authenticated
   *
   * @apiUse televisionParam
   */
  volumeDown: function(req, res, next) {
    gladys.television
      .volumeDown(req.body)
      .then(result => res.json(result))
      .catch(next);
  },

  /**
   * @api {post} /television/presskey Press Key
   * @apiName televisionPressKey
   * @apiGroup television
   * @apiPermission authenticated
   *
   * @apiUse televisionParam
   */
  pressKey: function(req, res, next) {
    gladys.television
      .pressKey(req.body)
      .then(result => res.json(result))
      .catch(next);
  },

  /**
   * @api {get} /television/source Get Sources
   * @apiName televisionGetSources
   * @apiGroup television
   * @apiPermission authenticated
   *
   * @apiUse televisionParam
   *
   * @apiSuccess {array} All television source
   */
  getSources: function(req, res, next) {
    gladys.television
      .getSources(req.query)
      .then(result => res.json(result))
      .catch(next);
  },

  /**
   * @api {post} /television/opensource Open Source
   * @apiName televisionOpenSource
   * @apiGroup television
   * @apiPermission authenticated
   *
   * @apiUse televisionParam
   */
  openSource: function(req, res, next) {
    gladys.television
      .openSource(req.body)
      .then(result => res.json(result))
      .catch(next);
  },

  /**
   * @api {post} /television/openmenu Open Menu
   * @apiName televisionOpenMenu
   * @apiGroup television
   * @apiPermission authenticated
   *
   * @apiUse televisionParam
   */
  openMenu: function(req, res, next) {
    gladys.television
      .openMenu(req.body)
      .then(result => res.json(result))
      .catch(next);
  },

  /**
   * @api {post} /television/rec Rec
   * @apiName televisionRec
   * @apiGroup television
   * @apiPermission authenticated
   *
   * @apiUse televisionParam
   */
  rec: function(req, res, next) {
    gladys.television
      .rec(req.body)
      .then(result => res.json(result))
      .catch(next);
  },

  /**
   * @api {post} /television/customcommand Custom Command
   * @apiName televisionCustomCommand
   * @apiGroup television
   * @apiPermission authenticated
   *
   * @apiUse televisionParam
   */
  customCommand: function(req, res, next) {
    gladys.television
      .customCommand(req.body)
      .then(result => res.json(result))
      .catch(next);
  },
    
  /**
   * @api {post} /television/programPlus Program Plus
   * @apiName televisionProgramPlus
   * @apiGroup television
   * @apiPermission authenticated
   *
   * @apiUse televisionParam
   */
  programPlus: function(req, res, next) {
    gladys.television
      .programPlus(req.body)
      .then(result => res.json(result))
      .catch(next);
  },
    
  /**
   * @api {post} /television/programMinus Program Minus
   * @apiName televisionProgramMinus
   * @apiGroup television
   * @apiPermission authenticated
   *
   * @apiUse televisionMinus
   */
  programMinus: function(req, res, next) {
    gladys.television
      .programMinus(req.body)
      .then(result => res.json(result))
      .catch(next);
  },

  /**
   * @api {post} /television/openInfo Open Info
   * @apiName televisionOpenInfo
   * @apiGroup television
   * @apiPermission authenticated
   *
   * @apiUse televisionParam
   */
  openInfo: function(req, res, next) {
    gladys.television
      .openInfo(req.body)
      .then(result => res.json(result))
      .catch(next);
  },
  
  /**
   * @api {post} /television/programVod Program Vod
   * @apiName televisionProgramVod
   * @apiGroup television
   * @apiPermission authenticated
   *
   * @apiUse televisionParam
   */
  programVod: function(req, res, next) {
    gladys.television
      .programVod(req.body)
      .then(result => res.json(result))
      .catch(next);
  }
};
