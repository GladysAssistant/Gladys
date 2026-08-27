const asyncMiddleware = require('../middlewares/asyncMiddleware');
const { Error400 } = require('../../utils/httpErrors');
const { ERROR_MESSAGES } = require('../../utils/constants');

/**
 * @apiDefine HouseParam
 * @apiParam {String} name Name of the house.
 * @apiParam {String} [selector] Selector of the house.
 * @apiParam {Number} [latitude] Latitude of the house.
 * @apiParam {Number} [longitude] Longitude of the house.
 */

module.exports = function HouseController(gladys) {
  /**
   * @api {post} /api/v1/house create
   * @apiName create
   * @apiGroup House
   * @apiUse HouseParam
   * @apiSuccessExample {json} Success-Example
   * {
   *   "id": "7932e6b3-b944-49a9-8d63-b98b8ecb2509",
   *   "name": "My house",
   *   "selector": "my-house",
   *   "updated_at": "2019-05-09T03:43:54.247Z",
   *   "created_at": "2019-05-09T03:43:54.247Z"
   * }
   */
  async function create(req, res) {
    const house = await gladys.house.create(req.body);
    res.status(201).json(house);
  }

  /**
   * @api {get} /api/v1/house get
   * @apiName get
   * @apiGroup House
   * @apiSuccessExample {json} Success-Example
   * [{
   *   "id": "7932e6b3-b944-49a9-8d63-b98b8ecb2509",
   *   "name": "My house",
   *   "selector": "my-house",
   *   "updated_at": "2019-05-09T03:43:54.247Z",
   *   "created_at": "2019-05-09T03:43:54.247Z"
   * }]
   */
  async function get(req, res) {
    const houses = await gladys.house.get(req.query);
    res.json(houses);
  }

  /**
   * @api {get} /api/v1/house/:house_selector getBySelector
   * @apiName getBySelector
   * @apiGroup House
   * @apiUse HouseParam
   * @apiSuccessExample {json} Success-Example
   * {
   *   "id": "7932e6b3-b944-49a9-8d63-b98b8ecb2509",
   *   "name": "My house",
   *   "selector": "my-house"
   *   "updated_at": "2019-05-09T03:43:54.247Z",
   *   "created_at": "2019-05-09T03:43:54.247Z"
   * }
   */
  async function getBySelector(req, res) {
    const house = await gladys.house.getBySelector(req.params.house_selector);
    res.json(house);
  }

  /**
   * @api {patch} /api/v1/house/:house_selector update
   * @apiName update
   * @apiGroup House
   * @apiUse HouseParam
   * @apiSuccessExample {json} Success-Example
   * {
   *   "id": "7932e6b3-b944-49a9-8d63-b98b8ecb2509",
   *   "name": "My house",
   *   "selector": "my-house"
   *   "updated_at": "2019-05-09T03:43:54.247Z",
   *   "created_at": "2019-05-09T03:43:54.247Z"
   * }
   */
  async function update(req, res) {
    const house = await gladys.house.update(req.params.house_selector, req.body);
    res.json(house);
  }

  /**
   * @api {delete} /api/v1/house/:house_selector delete
   * @apiName delete
   * @apiGroup House
   */
  async function destroy(req, res) {
    await gladys.house.destroy(req.params.house_selector);
    res.json({
      success: true,
    });
  }

  /**
   * @api {post} /api/v1/house/:house_selector/user/:user_selector/seen user seen
   * @apiName userSeen
   * @apiGroup House
   * @apiDescription Call this API if a user is seen in a house.
   * @apiSuccessExample {json} Success-Example
   * {
   *   "id": "e4e3f03e-60b9-485e-bc0a-c582b69089bd",
   *   "firstname": "tony",
   *   "lastname": "Stark",
   *   "selector": "tony",
   *   "email": "tony.stark@gladysassistant.com",
   *   "current_house_id": "7932e6b3-b944-49a9-8d63-b98b8ecb2509",
   *   "last_house_changed": "2019-05-09T03:57:53.034Z"
   * }
   */
  async function userSeen(req, res) {
    const user = await gladys.house.userSeen(req.params.house_selector, req.params.user_selector);
    res.json(user);
  }

  /**
   * @api {get} /api/v1/house/:house_selector/room getRooms
   * @apiName getRooms
   * @apiGroup House
   */
  async function getRooms(req, res) {
    const rooms = await gladys.house.getRooms(req.params.house_selector);
    res.json(rooms);
  }

  /**
   * @api {post} /api/v1/house/:house_selector/arm arm
   * @apiName arm
   * @apiGroup Alarm
   */
  async function arm(req, res) {
    await gladys.house.arm(req.params.house_selector);
    res.json({ success: true });
  }

  /**
   * @api {post} /api/v1/house/:house_selector/disarm Disarm
   * @apiName Disarm
   * @apiGroup Alarm
   */
  async function disarm(req, res) {
    const house = await gladys.house.disarm(req.params.house_selector);
    res.json(house);
  }

  /**
   * @api {post} /api/v1/house/:house_selector/disarm_with_code DisarmWithCode
   * @apiName DisarmWithCode
   * @apiGroup Alarm
   */
  async function disarmWithCode(req, res) {
    const house = await gladys.house.disarmWithCode(req.params.house_selector, req.body.code);
    res.json(house);
  }

  /**
   * @api {post} /api/v1/house/:house_selector/partial_arm Partial Arm
   * @apiName Partial Arm
   * @apiGroup Alarm
   */
  async function partialArm(req, res) {
    const house = await gladys.house.partialArm(req.params.house_selector);
    res.json(house);
  }

  /**
   * @api {post} /api/v1/house/:house_selector/disarm Disarm
   * @apiName Disarm
   * @apiGroup Alarm
   */
  async function panic(req, res) {
    const house = await gladys.house.panic(req.params.house_selector);
    res.json(house);
  }

  /**
   * @api {get} /api/v1/house/:house_selector/sun getSunState
   * @apiName getSunState
   * @apiGroup House
   * @apiDescription Get sun times, current sun position and daily elevation curve for a house.
   * Times are computed for the local day of the instance timezone. In polar day/night,
   * dawn, sunrise, sunset and dusk are null because the sun never crosses the horizon.
   * @apiSuccessExample {json} Success-Example
   * {
   *   "dawn": "2026-07-05T04:23:12.000Z",
   *   "sunrise": "2026-07-05T04:59:43.000Z",
   *   "solar_noon": "2026-07-05T11:55:36.000Z",
   *   "sunset": "2026-07-05T18:51:29.000Z",
   *   "dusk": "2026-07-05T19:28:00.000Z",
   *   "azimuth": 131.07,
   *   "elevation": 3.53,
   *   "curve": [{ "time": "2026-07-05T00:00:00.000Z", "elevation": -12.53 }]
   * }
   */
  async function getSunState(req, res) {
    const house = await gladys.house.getBySelector(req.params.house_selector);
    const { latitude, longitude } = house;
    if (latitude === null || latitude === undefined || longitude === null || longitude === undefined) {
      throw new Error400(ERROR_MESSAGES.HOUSE_HAS_NO_COORDINATES);
    }
    const sunState = await gladys.house.getSunState(house);
    res.json(sunState);
  }

  /**
   * @api {get} /api/v1/house/:house_selector/tide getTideState
   * @apiName getTideState
   * @apiGroup House
   * @apiDescription Get the tide state of a house: the tides framing the current moment, the
   * water level right now, the curve of the local day and, on the French coast, the tide
   * coefficient. When the house is inland or on a sea with no meaningful tide, "available" is
   * false and "reason" says which of the two it is.
   * @apiParam {Number} [day_offset=0] Which day to return, 0 being today, up to 6.
   * @apiSuccessExample {json} Success-Example
   * {
   *   "available": true,
   *   "timezone": "Europe/Paris",
   *   "station_name": "Saint Malo",
   *   "station_distance": 1,
   *   "current_height": 6.21,
   *   "rising": true,
   *   "next_high_tide": { "time": "2026-08-27T18:00:01.628Z", "height": 11.18, "high": true },
   *   "next_low_tide": { "time": "2026-08-28T00:47:14.218Z", "height": 2.27, "high": false },
   *   "coefficient": 78,
   *   "tide_range": 10.22,
   *   "curve": [{ "time": "2026-08-27T00:00:00.000Z", "height": 3.1 }]
   * }
   */
  async function getTideState(req, res) {
    const house = await gladys.house.getBySelector(req.params.house_selector);
    const { latitude, longitude } = house;
    if (latitude === null || latitude === undefined || longitude === null || longitude === undefined) {
      throw new Error400(ERROR_MESSAGES.HOUSE_HAS_NO_COORDINATES);
    }
    const dayOffset = req.query.day_offset ? Number.parseInt(req.query.day_offset, 10) : 0;
    const tideState = await gladys.house.getTideState(house, new Date(), { dayOffset });
    res.json(tideState);
  }

  return Object.freeze({
    create: asyncMiddleware(create),
    destroy: asyncMiddleware(destroy),
    get: asyncMiddleware(get),
    getBySelector: asyncMiddleware(getBySelector),
    update: asyncMiddleware(update),
    userSeen: asyncMiddleware(userSeen),
    getRooms: asyncMiddleware(getRooms),
    getSunState: asyncMiddleware(getSunState),
    getTideState: asyncMiddleware(getTideState),
    arm: asyncMiddleware(arm),
    disarm: asyncMiddleware(disarm),
    disarmWithCode: asyncMiddleware(disarmWithCode),
    partialArm: asyncMiddleware(partialArm),
    panic: asyncMiddleware(panic),
  });
};
