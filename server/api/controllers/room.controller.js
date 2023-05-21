const asyncMiddleware = require('../middlewares/asyncMiddleware');
const { buildExpandObject } = require('../../utils/buildExpandObject');
/**
 * @apiDefine RoomParam
 * @apiParam {String} name Name of the room.
 * @apiParam {String} [selector] Selector of the room
 */

module.exports = function RoomController(gladys) {
  /**
   * @api {post} /api/v1/house/:house_selector/room create
   * @apiName create
   * @apiGroup Room
   * @apiUse RoomParam
   * @apiSuccessExample {json} Success-Example
   * {
   *   "id": "ac7f1ab2-0468-4750-bcdd-7e43b34e136a",
   *   "name": "my room",
   *   "selector": "my-room",
   *   "house_id": "7932e6b3-b944-49a9-8d63-b98b8ecb2509",
   *   "updated_at": "2019-05-09T04:01:48.983Z",
   *   "created_at": "2019-05-09T04:01:48.983Z"
   * }
   */
  async function create(req, res) {
    const newRoom = await gladys.room.create(req.params.house_selector, req.body);
    res.status(201).json(newRoom);
  }

  /**
   * @api {patch} /api/v1/room/:room_selector update
   * @apiName update
   * @apiGroup Room
   * @apiUse RoomParam
   * @apiSuccessExample {json} Success-Example
   * {
   *   "id": "ac7f1ab2-0468-4750-bcdd-7e43b34e136a",
   *   "name": "my room",
   *   "selector": "my-room",
   *   "house_id": "7932e6b3-b944-49a9-8d63-b98b8ecb2509",
   *   "updated_at": "2019-05-09T04:01:48.983Z",
   *   "created_at": "2019-05-09T04:01:48.983Z"
   * }
   */
  async function update(req, res) {
    const newRoom = await gladys.room.update(req.params.room_selector, req.body);
    res.json(newRoom);
  }

  /**
   * @api {delete} /api/v1/room/:room_selector delete
   * @apiName delete
   * @apiGroup Room
   */
  async function destroy(req, res) {
    await gladys.room.destroy(req.params.room_selector);
    res.json({
      success: true,
    });
  }

  /**
   * @api {get} /api/v1/room/:room_selector get by selector
   * @apiName getBySelector
   * @apiGroup Room
   * @apiParam {string=temperature} [expand] Expand fields
   * @apiSuccessExample {json} Success-Example
   * {
   *   "id": "ac7f1ab2-0468-4750-bcdd-7e43b34e136a",
   *   "name": "my room",
   *   "selector": "my-room",
   *   "house_id": "7932e6b3-b944-49a9-8d63-b98b8ecb2509",
   *   "updated_at": "2019-05-09T04:01:48.983Z",
   *   "created_at": "2019-05-09T04:01:48.983Z",
   *   "temperature": {
   *     "temperature": 29,
   *     "unit": "celsius"
   *   }
   * }
   */
  async function getBySelector(req, res) {
    const room = await gladys.room.getBySelector(req.params.room_selector, req.query);
    const expandFields = buildExpandObject(req.query.expand);
    // if the user wants the temperature in the room
    if (expandFields.temperature) {
      room.temperature = await gladys.device.temperatureSensorManager.getTemperatureInRoom(room.id, {
        unit: req.user.temperature_unit_preference,
      });
    }
    // if the user wants the humidity in the room
    if (expandFields.humidity) {
      room.humidity = await gladys.device.humiditySensorManager.getHumidityInRoom(room.id);
    }
    res.json(room);
  }

  /**
   * @api {get} /api/v1/room get
   * @apiName get
   * @apiGroup Room
   * @apiSuccessExample {json} Success-Response:
   * [
   *   {
   *   "id": "2398c689-8b47-43cc-ad32-e98d9be098b5",
   *   "house_id": "a741dfa6-24de-4b46-afc7-370772f068d5",
   *   "name": "Test room",
   *   "selector": "test-room",
   *   "created_at": "2019-02-12T07:49:07.556Z",
   *   "updated_at": "2019-02-12T07:49:07.556Z",
   *   "devices": [
   *     {
   *       "name": "Test device",
   *       "selector": "test-device",
   *       "features": [
   *         {
   *           "name": "Test device feature",
   *           "selector": "test-device-feature",
   *           "category": "light",
   *           "type": "binary",
   *           "read_only": false,
   *           "unit": null,
   *           "min": 0,
   *           "max": 1,
   *           "last_value": 0,
   *           "last_value_changed": "2019-02-12T07:49:07.556Z"
   *         }
   *       ]
   *     }
   *   ]
   * }
   * ]
   */
  async function get(req, res) {
    const options = req.query;
    if (options.expand) {
      options.expand = options.expand.split(',');
    }
    const rooms = await gladys.room.get(options);
    res.json(rooms);
  }

  return Object.freeze({
    create: asyncMiddleware(create),
    destroy: asyncMiddleware(destroy),
    update: asyncMiddleware(update),
    getBySelector: asyncMiddleware(getBySelector),
    get: asyncMiddleware(get),
  });
};
