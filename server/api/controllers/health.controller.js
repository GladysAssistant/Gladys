const asyncMiddleware = require('../middlewares/asyncMiddleware');
// const { Error400 } = require('../../utils/httpErrors');
// const { ERROR_MESSAGES } = require('../../utils/constants');

module.exports = function HealthController(gladys) {
  /**
   * @api {get} /api/v1/health get health data
   * @apiName getHealthData
   * @apiGroup Health
   * @apiSuccessExample {json} Success-Example
   * {
   *  user: {
   *    id: '91251d41-7886-40e7-b7e6-4db0a91b9d47',
   *    name: 'euguuu'
   *  },
   *  devices: [
   *  {
   *    id: '5f288af2-86d6-4501-a4d8-b84bc4e90e60',
   *    name: 'Withings - Body',
   *    features: [
   *      {
   *        id: 'b50bccab-c3ae-41d4-9401-a5650c46ed02',
   *        name: 'Battery',
   *        unit: 'percent',
   *        selector: 'withings-battery-5f288af2-86d6-4501-a4d8-b84bc4e90e60',
   *        last_value: '20',
   *        last_value_string: '20',
   *        last_value_changer: new Date(),
   *        category: 'health',
   *        type: 'battery',
   *        read_only: true,
   *      },
   *    ]
   *  }
   * }
   */
  async function getHealthData(req, res) {
    // Get all device for health
    const device = await gladys.device.get({ device_feature_category: 'health' });
    const result = {
      user: {
        id: req.user.id,
        name: req.user.firstname,
      },
      devices: [],
    };

    device.forEach((element) => {
      const deviceFeatures = [];
      element.features.forEach((tmpFeat) => {
        deviceFeatures.push({
          id: tmpFeat.id,
          name: tmpFeat.name,
          unit: tmpFeat.unit,
          selector: tmpFeat.selector,
          last_value: tmpFeat.last_value,
          last_value_string: tmpFeat.last_value_string,
          last_value_changer: tmpFeat.last_value_changer,
          category: tmpFeat.category,
          type: tmpFeat.type,
          read_only: tmpFeat.read_only,
        });
      });

      result.devices.push({
        id: element.id,
        name: element.name,
        features: deviceFeatures,
      });
    });

    res.json(result);
  }

  return Object.freeze({
    getHealthData: asyncMiddleware(getHealthData),
  });
};
