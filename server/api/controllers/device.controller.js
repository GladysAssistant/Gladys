const { LTTB } = require('downsample');
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
   * @api {get} /api/v1/device/device_feature_sate/:device_selector/:device_feature_selector getDeviceFeatureStates
   * @apiName getDeviceFeatureStates
   * @apiGroup Device
   */
  async function getDeviceFeatureStates(req, res) {
    const params = Object.assign({}, req.query, {
      device_selector: req.params.device_selector,
      device_feature_selector: req.params.device_feature_selector,
    });
    const devices = await gladys.device.getFeatureStates(params); 
    if(devices && devices.length > 0){
      // TODO: fix le nb max de value + le type d'algo (en par de la request)
      const chartWidth = 100;
      const featureArray = [];
      devices.forEach(device => {
        device.features.forEach(feature => {
          if(feature.device_feature_states && feature.device_feature_states.length > 0){

            const newFeatureStateArray = [];
            feature.device_feature_states.forEach(function changeState(state, index) {
              newFeatureStateArray.push({
                x: state.created_at, 
                y: state.value
              });
            });

            const smoothFeatureStates = LTTB(newFeatureStateArray, chartWidth);
            feature.device_feature_states = smoothFeatureStates;
            featureArray.push(feature);
          }      
        });
        device.features = featureArray;
      });
    }

    res.json(devices);
  }

  return Object.freeze({
    create: asyncMiddleware(create),
    get: asyncMiddleware(get),
    getDevicesByService: asyncMiddleware(getDevicesByService),
    getBySelector: asyncMiddleware(getBySelector),
    destroy: asyncMiddleware(destroy),
    setValue: asyncMiddleware(setValue),
    setValueFeature: asyncMiddleware(setValueFeature),
    getDeviceFeatureStates: asyncMiddleware(getDeviceFeatureStates),
  });
};
