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
    const params = Object.assign({}, req.query, {
      service: req.params.service_name,
    });
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
   * @api {get} /api/v1/device_feature/states getDeviceFeaturesStates
   * @apiName getDeviceFeaturesStates
   * @apiGroup Device
   *
   * @apiParam {String} name Name of the dashboard.
   * @apiParam {String} device_features Device(s) feature(s) selector(s)
   * (can contain 4 features from different devices).
   * @apiParam {string} start_interval Start date in UTC format "yyyy-mm-ddThh:mm:ss:sssZ"
   * or "yyyy-mm-dd hh:mm:ss:sss" (GMT time).
   * @apiParam {string} [end_interval] End date in UTC format "yyyy-mm-ddThh:mm:ss:sssZ"
   * or "yyyy-mm-dd hh:mm:ss:sss" (GMT time)..
   * @apiParamExample {json} Request-Example:
   * {
   *   "device_features": "test-device-feature-1,test-device-feature-2",
   *   "start_interval": "2022-03-31T22:00:00.000Z",
   *   "end_interval": "2022-04-01T21:59:59.999Z"
   * }
   * OU
   * {
   *   "device_features": "test-device-feature-1,test-device-feature-2",
   *   "start_interval": "2022-04-01 00:00:00.000",
   *   "end_interval": "2022-04-01 23:59:00.000"
   * }
   * @apiSuccessExample {json} Success-Response:
   * [
   * 	{
   * 		"device":
   * 		{
   * 			"name": "Test device"
   * 		},
   * 		"deviceFeature":
   * 		{
   * 			"name": "Test device_feature 1"
   * 			"selector": "test-device-feature-1",
   * 			"external_id": "mqtt:test_device_feature_1",
   * 		},
   * 		"dataRaw":
   * 		[
   * 			[
   * 				"2022-04-01T06:13:26.651Z",
   * 				55
   * 			],
   * 			[
   * 				"2022-04-01T06:14:26.655Z",
   * 				52
   * 			],
   * 			[
   * 				"2022-04-01T06:15:26.654Z",
   * 				27
   * 			]
   * 		]
   * 	},
   * 	{
   * 		"device":
   * 		{
   * 			"name": "Test device"
   * 		},
   * 		"deviceFeature":
   * 		{
   * 			"name": "Test device_feature 2"
   * 			"selector": "test-device-feature-2",
   * 			"external_id": "mqtt:test_device_feature_2",
   * 		},
   * 		"dataRaw":
   * 		[
   * 			[
   * 				"2022-04-01T06:13:26.657Z",
   * 				1104
   * 			],
   * 			[
   * 				"2022-04-01T06:14:26.655Z",
   * 				758
   * 			],
   * 			[
   * 				"2022-04-01T06:15:26.654Z",
   * 				2300
   * 			]
   * 		]
   * 	}
   * ]
   */
  async function getDeviceFeaturesStates(req, res) {
    const states = await gladys.device.getDeviceFeaturesStatesMulti(
      req.query.device_features.split(','),
      req.query.start_interval,
      req.query.end_interval,
    );
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
