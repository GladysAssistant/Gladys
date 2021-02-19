const { Op } = require('sequelize');
const db = require('../../models');

const DEFAULT_OPTIONS = {
  skip: 0,
  order_dir: 'ASC',
  order_by: 'name',
};

/**
 * @description Get list of device feature states
 * @param {Object} [options] - Options of the query.
 * @returns {Promise} List of device with device feature state.
 * @example
 * const devices = await gladys.device.getFeatureStates({
 *  device_feature_selector: 'test-selector'
 * });
 */
async function getFeatureStates(options) {
  const optionsWithDefault = Object.assign({}, DEFAULT_OPTIONS, options);

  // Build query for not feature_state info
  const queryParams = {
    include: [
      {
        model: db.DeviceFeature,
        as: 'features',
      },
      {
        model: db.Room,
        as: 'room',
      },
    ],
    offset: optionsWithDefault.skip,
  };

  // Fix attributes
  if (optionsWithDefault.attributes_device && optionsWithDefault.attributes_device.length > 0) {
    queryParams.attributes = optionsWithDefault.attributes_device;
  }
  if (optionsWithDefault.attributes_device_feature && optionsWithDefault.attributes_device_feature.length > 0) {
    queryParams.include[0].attributes = optionsWithDefault.attributes_device_feature;
  }
  if (optionsWithDefault.attributes_device_room && optionsWithDefault.attributes_device_room.length > 0) {
    queryParams.include[1].attributes = optionsWithDefault.attributes_device_room;
  }

  // Search by feature selector
  if (optionsWithDefault.device_feature_selector) {
    if (optionsWithDefault.device_feature_selector.length > 1) {
      queryParams.include[0].where = {
        selector: { [Op.in]: optionsWithDefault.device_feature_selector },
      };
    } else {
      queryParams.include[0].where = {
        selector: { [Op.eq]: optionsWithDefault.device_feature_selector },
      };
    }
  }

  const devices = await db.Device.findAll(queryParams);
  const devicesPlain = await devices.map((device) => device.get({ plain: true }));

  if (devicesPlain && devicesPlain.length > 0) {
    for (let i = 0; i < devicesPlain.length; i += 1) {
      // devicesPlain.forEach( (device, index) => {
      const device = devicesPlain[i];
      if (device.features && device.features.length > 0) {
        for (let j = 0; j < device.features.length; j += 1) {
          // device.features.forEach( async (feature, indexFeat, array)  => {
          const feature = device.features[j];
          // Search feature state of current feature
          let beginStateSearchDate = optionsWithDefault.begin_date;
          let currentState = [];

          // If column last_downsampling is explicitly asked
          // => part of data is extract from device_feature_state_light
          if (
            feature.last_downsampling &&
            optionsWithDefault.attributes_device_feature &&
            optionsWithDefault.attributes_device_feature.length > 0 &&
            optionsWithDefault.attributes_device_feature.includes('last_downsampling')
          ) {
            const queryStateLightParams = {
              where: {
                device_feature_id: { [Op.eq]: feature.id },
                created_at: { [Op.between]: [optionsWithDefault.begin_date, feature.last_downsampling] },
              },
              order: [['created_at', 'ASC']],
              raw: true,
            };
            // eslint-disable-next-line no-await-in-loop
            currentState = currentState.concat(await db.DeviceFeatureStateLight.findAll(queryStateLightParams));
            beginStateSearchDate = feature.last_downsampling;
          }

          const queryStateParams = {
            where: {
              device_feature_id: { [Op.eq]: feature.id },
              created_at: { [Op.between]: [beginStateSearchDate, optionsWithDefault.end_date] },
            },
            order: [['created_at', 'ASC']],
            raw: true,
          };

          // eslint-disable-next-line no-await-in-loop
          currentState = currentState.concat(await db.DeviceFeatureState.findAll(queryStateParams));
          feature.device_feature_states = currentState;
        }
      }
    }
  }

  return devicesPlain;
}

module.exports = {
  getFeatureStates,
};
