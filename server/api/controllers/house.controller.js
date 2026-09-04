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
   * @api {get} /api/v1/house/:house_selector/moon getMoonState
   * @apiName getMoonState
   * @apiGroup House
   * @apiDescription Get the moon phase, illumination, position and upcoming lunar events for a house.
   * Moonrise and moonset are computed for the local day of the instance timezone, and are null
   * when the moon does not cross the horizon on that day.
   * @apiParam {Boolean} [at_midnight] Compute the values at local midnight instead of the current
   * time, the way lunar calendars publish them. Moonrise and moonset are not affected.
   * @apiSuccessExample {json} Success-Example
   * {
   *   "timezone": "Europe/Paris",
   *   "phase": 0.35,
   *   "phase_name": "waxingGibbous",
   *   "illumination": 80,
   *   "waxing": true,
   *   "ascending": true,
   *   "age_days": 10.4,
   *   "distance": 405562,
   *   "zodiac_sign": "capricorn",
   *   "azimuth": 84.47,
   *   "elevation": -41.7,
   *   "moonrise": "2026-08-23T16:45:54.459Z",
   *   "moonset": "2026-08-22T23:23:11.684Z",
   *   "next_new_moon": "2026-09-11T01:27:46.406Z",
   *   "next_first_quarter": "2026-09-18T19:46:03.281Z",
   *   "next_full_moon": "2026-08-28T07:00:21.094Z",
   *   "next_last_quarter": "2026-09-04T06:54:43.594Z",
   *   "next_perigee": "2026-09-05T11:31:53.587Z",
   *   "next_apogee": "2026-09-19T06:11:02.904Z",
   *   "next_node": "2026-08-27T10:12:04.219Z",
   *   "next_node_ascending": true,
   *   "next_eclipse": "2027-02-20T21:04:48.282Z",
   *   "next_eclipse_type": "penumbral"
   * }
   */
  async function getMoonState(req, res) {
    const house = await gladys.house.getBySelector(req.params.house_selector);
    const { latitude, longitude } = house;
    if (latitude === null || latitude === undefined || longitude === null || longitude === undefined) {
      throw new Error400(ERROR_MESSAGES.HOUSE_HAS_NO_COORDINATES);
    }
    const atMidnight = req.query.at_midnight === 'true';
    const moonState = await gladys.house.getMoonState(house, new Date(), { atMidnight });
    res.json(moonState);
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
    getMoonState: asyncMiddleware(getMoonState),
    arm: asyncMiddleware(arm),
    disarm: asyncMiddleware(disarm),
    disarmWithCode: asyncMiddleware(disarmWithCode),
    partialArm: asyncMiddleware(partialArm),
    panic: asyncMiddleware(panic),
  });
};
