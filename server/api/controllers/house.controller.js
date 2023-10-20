const asyncMiddleware = require('../middlewares/asyncMiddleware');

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

  return Object.freeze({
    create: asyncMiddleware(create),
    destroy: asyncMiddleware(destroy),
    get: asyncMiddleware(get),
    getBySelector: asyncMiddleware(getBySelector),
    update: asyncMiddleware(update),
    userSeen: asyncMiddleware(userSeen),
    getRooms: asyncMiddleware(getRooms),
    arm: asyncMiddleware(arm),
    disarm: asyncMiddleware(disarm),
    disarmWithCode: asyncMiddleware(disarmWithCode),
    partialArm: asyncMiddleware(partialArm),
    panic: asyncMiddleware(panic),
  });
};
