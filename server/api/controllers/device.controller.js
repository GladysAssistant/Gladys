const asyncMiddleware = require('../middlewares/asyncMiddleware');
const { EVENTS, ACTIONS, ACTIONS_STATUS } = require('../../utils/constants');

module.exports = function DeviceController(gladys) {
  /**
   * @api {get} /api/v1/device/:device_selector getBySelector
   * @apiName getBySelector
   * @apiGroup Device
   */
  async function getBySelector(req, res) {
    const device = gladys.device.getBySelector(req.params.device_selector);
    res.json(device);
  }

  /**
   * @api {get} /api/v1/device get
   * @apiName get
   * @apiGroup Device
   */
  async function get(req, res) {
    const devices = await gladys.device.get(req.query);
    res.json(devices);
  }

  /**
   * @api {get} /api/v1/service/:service_name/device getDevicesByService
   * @apiName getDevicesByService
   * @apiGroup Device
   */
  async function getDevicesByService(req, res) {
    const params = {
      ...req.query,
      service: req.params.service_name,
    };
    const devices = await gladys.device.get(params);
    res.json(devices);
  }

  /**
   * @api {post} /api/v1/device create
   * @apiName create
   * @apiGroup Device
   */
  async function create(req, res) {
    const device = await gladys.device.create(req.body);
    res.json(device);
  }

  /**
   * @api {delete} /api/v1/device/:device_selector delete
   * @apiName delete
   * @apiGroup Device
   */
  async function destroy(req, res) {
    await gladys.device.destroy(req.params.device_selector);
    res.json({
      success: true,
    });
  }

  /**
   * @api {post} /api/v1/device/:device_selector/:feature_category/:feature_type/value setValue
   * @apiName setValue
   * @apiGroup Device
   */
  async function setValue(req, res) {
    const action = {
      type: ACTIONS.DEVICE.SET_VALUE,
      device: req.params.device_selector,
      feature_category: req.params.feature_category,
      feature_type: req.params.feature_type,
      value: req.body.value,
      status: ACTIONS_STATUS.PENDING,
    };
    gladys.event.emit(EVENTS.ACTION.TRIGGERED, action);
    res.json(action);
  }

  /**
   * @api {post} /api/v1/device_feature/:device_feature_selector/value setValueFeature
   * @apiName setValueFeature
   * @apiGroup Device
   */
  async function setValueFeature(req, res) {
    const action = {
      type: ACTIONS.DEVICE.SET_VALUE,
      device_feature: req.params.device_feature_selector,
      value: req.body.value,
      status: ACTIONS_STATUS.PENDING,
    };
    gladys.event.emit(EVENTS.ACTION.TRIGGERED, action);
    res.json(action);
  }

  /**
   * @api {get} /api/v1/device_feature/aggregated_states getDeviceFeaturesAggregated
   * @apiName getDeviceFeaturesAggregated
   * @apiGroup Device
   */
  async function getDeviceFeaturesAggregated(req, res) {
    const states = await gladys.device.getDeviceFeaturesAggregatesMulti(
      req.query.device_features.split(','),
      req.query.interval,
      req.query.max_states,
    );
    res.json(states);
  }

  /**
   * @api {get} /api/v1/device_feature/:device_feature_selector/states getDeviceFeaturesStates
   * @apiName getDeviceFeatureStates
   * @apiGroup Device
   * @apiParam {string} from - Start date in UTC format "yyyy-mm-ddThh:mm:ss:sssZ"
   * or "yyyy-mm-dd hh:mm:ss:sss" (GMT time).
   * @apiParam {string} [to="now"] - End date in UTC format "yyyy-mm-ddThh:mm:ss:sssZ"
   * or "yyyy-mm-dd hh:mm:ss:sss" (GMT time).
   * @apiParam {number} [take] - Number of elements to return.
   * @apiParam {number} [skip=0] - Number of elements to skip.
   * @apiParam {number} [attributes] - Possible values (separated by a comma ',' if several): 'id',
   * 'device_feature_id', 'value', 'created_at' and 'updated_at'. Leave empty to have all the columns.
   * @apiParamExample {json} Request-Example with take and skip:
   * {
   *   "from": "2022-04-06T07:00:00.000Z",
   *   "to": "2022-04-06T21:59:59.999Z",
   *   "take": 3,
   *   "skip": 5
   * }
   * @apiSuccessExample {json} Success-Response with take and skip:
   * [
   * 	{
   * 		id: 'e1f30d6e-7891-4484-9aa7-2e094b53ed6c',
   * 		device_feature_id: '83c31637-8cb3-4085-b518-dbe2f89b7d0c',
   * 		value: 13,
   * 		created_at: '2022-04-06 09:05:09.127 +00:00',
   * 		updated_at: '2022-04-06 09:05:09.127 +00:00'
   * 	},
   * 	{
   * 		id: '77bb6449-cdd0-4163-9f38-95102e1cbafa',
   * 		device_feature_id: '83c31637-8cb3-4085-b518-dbe2f89b7d0c',
   * 		value: 16,
   * 		created_at: '2022-04-06 09:06:09.146 +00:00',
   * 		updated_at: '2022-04-06 09:06:09.146 +00:00'
   * 	},
   * 	{
   * 		id: '61a87d2a-93e7-4c6c-bd0e-a337803c236c',
   * 		device_feature_id: '83c31637-8cb3-4085-b518-dbe2f89b7d0c',
   * 		value: 108,
   * 		created_at: '2022-04-06 09:07:09.137 +00:00',
   * 		updated_at: '2022-04-06 09:07:09.137 +00:00'
   * 	}
   * ]
   * @apiParamExample {json} Request-Example with attributes:
   * {
   *   'from': "2022-04-06 10:00:00.000",
   *   'to': "2022-04-09 23:59:00.000",
   *   'attributes': "created_at,value,id"
   * }
   * @apiSuccessExample {json} Success-Response with attributes definitions:
   * [
   * 	{
   * 		created_at: '2022-04-06 10:00:09.225 +00:00',
   * 		value: 139,
   * 		id: '30c43c01-0718-40cd-84e0-b975894bd5af'
   * 	},
   * 	{
   * 		created_at: '2022-04-06 10:01:09.219 +00:00',
   * 		value: 140,
   * 		id: 'd1674409-6baf-4658-abf0-070cbc5cbeef',
   * 	},
   * 	{
   * 		created_at: '2022-04-06 10:02:09.166 +00:00',
   * 		value: 141,
   * 		id: '53129293-0b7c-4ced-be7d-7809fa558c96'
   * 	},
   * 	{
   * 		...
   * 	},
   * 	... 3878 more items
   * ]
   */
  async function getDeviceFeaturesStates(req, res) {
    const states = await gladys.device.getDeviceFeaturesStates(req.params.device_feature_selector, req.query);
    res.json(states);
  }

  return Object.freeze({
    create: asyncMiddleware(create),
    get: asyncMiddleware(get),
    getDevicesByService: asyncMiddleware(getDevicesByService),
    getBySelector: asyncMiddleware(getBySelector),
    destroy: asyncMiddleware(destroy),
    setValue: asyncMiddleware(setValue),
    setValueFeature: asyncMiddleware(setValueFeature),
    getDeviceFeaturesAggregated: asyncMiddleware(getDeviceFeaturesAggregated),
    getDeviceFeaturesStates: asyncMiddleware(getDeviceFeaturesStates),
  });
};
