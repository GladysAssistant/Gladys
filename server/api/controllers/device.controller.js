const { LTD } = require('downsample');
const trend = require('trend');
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
   * @api {get} /api/v1/device/device_feature/:device_feature_selector getDeviceFeature
   * @apiName getDeviceFeature
   * @apiGroup Device
   */
  async function getDeviceFeature(req, res) {
    
    const params = Object.assign({}, req.query, {
      device_feature_selector: req.params.device_feature_selector.split(','),
    }); 

    // Choose attributes
    params.attributes_device = [];
    params.attributes_device.push('name');
    params.attributes_device.push('selector');
    params.attributes_device_feature = [];
    params.attributes_device_feature.push('name');
    params.attributes_device_feature.push('selector');
    params.attributes_device_feature.push('unit');
    params.attributes_device_feature.push('last_value');
    params.attributes_device_feature.push('last_value_changed');
    params.attributes_device_feature.push('last_value_changed');
    params.attributes_device_room = [];
    params.attributes_device_room.push('name');
    params.attributes_device_room.push('selector');
    params.attributes_device_service = [];
    params.attributes_device_service.push('name');
    params.attributes_device_param = [];
    params.attributes_device_param.push('name');

    const devices = await gladys.device.get(params);
    
    res.json(devices);
  }
  /**
   * @api {get} /api/v1/device_feature_sate/:device_feature_selector getDeviceFeatureStates
   * @apiName getDeviceFeatureStates
   * @apiGroup Device
   */
  async function getDeviceFeatureStates(req, res) {

    // const debut=new Date();
    const params = Object.assign({}, req.query, {
      device_feature_selector: req.params.device_feature_selector.split(','),
    });

    // fix period
    const beginDate = new Date();
    switch (params.chartPeriod) {
      case 'last2day-selector':
        beginDate.setDate(beginDate.getDate() - 2);
        break;
      case 'last1week-selector':
        beginDate.setDate(beginDate.getDate() - 7);
        break;
      case 'last1month-selector':
        beginDate.setDate(beginDate.getDate() - 31);
        break;
      case 'last1year-selector':
        beginDate.setDate(beginDate.getDate() - 365);
        break;
      case 'last1day-selector':
      default:
        beginDate.setDate(beginDate.getDate() - 1);
    }

    params.begin_date = beginDate;
    params.end_date = new Date();

    // Choose attributes
    params.attributes_device = [];
    params.attributes_device.push('name');
    params.attributes_device.push('selector');
    params.attributes_device_feature = [];
    params.attributes_device_feature.push('name');
    params.attributes_device_feature.push('selector');
    params.attributes_device_feature.push('unit');
    params.attributes_device_feature.push('last_value');
    params.attributes_device_feature.push('last_value_changed');
    params.attributes_device_room = [];
    params.attributes_device_room.push('name');
    params.attributes_device_room.push('selector');

    const devices = await gladys.device.getFeatureStates(params);

    // Downsample result to reduce nb of value in response
    if (params.downsample && params.downsample === 'true') {
      if (devices && devices.length > 0) {
        let chartWidth = 100;
        if (params.maxValue) {
          chartWidth = params.maxValue;
        }
        const featureArray = [];
        const featureValuesArray = [];
        devices.forEach((device) => {
          device.features.forEach((feature) => {
            if (feature.device_feature_states && feature.device_feature_states.length > 0) {
              const newFeatureStateArray = [];
              feature.device_feature_states.forEach(function changeState(state, index) {
                newFeatureStateArray.push({
                  x: new Date(state.created_at).getTime(),
                  y: state.value,
                });
                featureValuesArray.push(state.value);
              });

              // Choice algo of downsampling use
              let smoothFeatureStates = newFeatureStateArray;
              if(newFeatureStateArray.length > chartWidth){
                smoothFeatureStates = LTD(newFeatureStateArray, chartWidth);
              }
              feature.device_feature_states = smoothFeatureStates;
              feature.trend = trend(featureValuesArray, {
                lastPoints: 3,
                avgPoints: 10,
                avgMinimum: 10,
                reversed: false,
              });

              featureArray.push(feature);
            }
          });
          device.features = featureArray;
        });
      }
    }
    
    // console.log('fin; '+ debut + ' - ' +new Date());
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
    getDeviceFeature: asyncMiddleware(getDeviceFeature),
    getDeviceFeatureStates: asyncMiddleware(getDeviceFeatureStates),
  });
};
