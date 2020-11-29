const { LTTB, ASAP, SMA, LTOB, LTD } = require('downsample');
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
   * @api {get} /api/v1/device/device_feature_sate/:device_feature_selector getDeviceFeatureStates
   * @apiName getDeviceFeatureStates
   * @apiGroup Device
   */
  async function getDeviceFeatureStates(req, res) {
    const params = Object.assign({}, req.query, {
      device_feature_selector: req.params.device_feature_selector.split(','),
    });

    // fix period
    const beginDate = new Date();
    switch (params.chartPeriod) {
      case 'last2day-selector':
        beginDate.setDate(beginDate.getDate() - 2);
        break;
      case 'lastweek-selector':
        beginDate.setDate(beginDate.getDate() - 7);
        break;
      case 'last1month-selector':
        beginDate.setDate(beginDate.getDate() - 31);
        break;
      case 'lastyear-selector':
        beginDate.setDate(beginDate.getDate() - 365);
        break;
      case 'last1day-selector':
      default:
        beginDate.setDate(beginDate.getDate() - 1);
    }

    params.begin_date = beginDate;
    params.end_date = new Date();

    console.log('params: ', params);
    const devices = await gladys.device.getFeatureStates(params);

    // Downsample result to reduce nb of value in response
    if (params.downsample && params.downsample === 'true') {
      if (devices && devices.length > 0) {
        let chartWidth = 100;
        if (params.maxValue) {
          chartWidth = params.maxValue;
        }
        const featureArray = [];
        devices.forEach((device) => {
          device.features.forEach((feature) => {
            if (feature.device_feature_states && feature.device_feature_states.length > 0) {
              const newFeatureStateArray = [];
              feature.device_feature_states.forEach(function changeState(state, index) {
                newFeatureStateArray.push({
                  x: state.created_at,
                  y: state.value,
                });
              });

              // Choice algo of downsampling use
              let smoothFeatureStates;
              switch (params.downsamplemethod) {
                case 'LTOB':
                  smoothFeatureStates = LTOB(newFeatureStateArray, chartWidth);
                  break;
                case 'LTD':
                  smoothFeatureStates = LTD(newFeatureStateArray, chartWidth);
                  break;
                case 'SMA':
                  smoothFeatureStates = SMA(newFeatureStateArray, chartWidth);
                  break;
                case 'ASAP':
                  smoothFeatureStates = ASAP(newFeatureStateArray, chartWidth);
                  break;
                case 'LTTB':
                default:
                  smoothFeatureStates = LTTB(newFeatureStateArray, chartWidth);
              }
              feature.device_feature_states = smoothFeatureStates;
              featureArray.push(feature);
            }
          });
          device.features = featureArray;
        });
      }
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
