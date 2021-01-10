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
    // order: [[optionsWithDefault.order_by, optionsWithDefault.order_dir]],
  };

  // fix attributes
  if (optionsWithDefault.attributes_device && optionsWithDefault.attributes_device.length > 0) {
    queryParams.attributes = optionsWithDefault.attributes_device;
  }
  if (optionsWithDefault.attributes_device_feature && optionsWithDefault.attributes_device_feature.length > 0) {
    queryParams.include[0].attributes = optionsWithDefault.attributes_device_feature;
  }
  if (optionsWithDefault.attributes_device_room && optionsWithDefault.attributes_device_room.length > 0) {
    queryParams.include[1].attributes = optionsWithDefault.attributes_device_room;
  }

  // search by feature selector
  if (optionsWithDefault.device_feature_selector) {
    if (optionsWithDefault.device_feature_selector.indexOf(',') > 0) {
      queryParams.include[0].where = {
        selector: { [Op.in]: optionsWithDefault.device_feature_selector },
      };
    } else {
      queryParams.include[0].where = {
        selector: { [Op.eq]: optionsWithDefault.device_feature_selector },
      };
    }
  }
  const result = await db.sequelize.transaction(async (t) => {
    const devices = await db.Device.findAll(queryParams, { transaction: t });

    const devicesPlain = devices.map((device) => device.get({ plain: true }));

    // Search feature state
    // Build list of features id
    let featuresId = '';
    devicesPlain.forEach((device) => {
      device.features.forEach((feature) => {
        if (featuresId.length > 0) {
          featuresId += ', ';
        }
        featuresId += feature.id;
        feature.device_feature_states = [];
      });
    });
    // Put where condition on feature id
    let queryStateParams =
      'SELECT ' +
      'device_feature_id, ' +
      'value, ' +
      'created_at ' +
      'FROM ' +
      't_device_feature_state ' +
      'WHERE ' +
      'device_feature_id';
    if (featuresId.indexOf(',') > 0) {
      queryStateParams += ' in ( :feature_id )';
    } else {
      queryStateParams += ' = :feature_id ';
    }

    if (optionsWithDefault.begin_date || optionsWithDefault.end_date) {
      if (optionsWithDefault.begin_date && !optionsWithDefault.end_date) {
        queryStateParams += 'AND created_at >= :begin_date ';
      }
      if (!optionsWithDefault.begin_date && optionsWithDefault.end_date) {
        queryStateParams += 'AND created_at < :end_date ';
      }
      if (optionsWithDefault.begin_date && optionsWithDefault.end_date) {
        queryStateParams += 'AND created_at BETWEEN :begin_date AND :end_date ';
      }
    }
    queryStateParams += 'ORDER BY created_at ASC';

    const deviceFeaturesStates = [];
    await db.sequelize
      .query(queryStateParams, {
        replacements: {
          feature_id: featuresId,
          begin_date: optionsWithDefault.begin_date,
          end_date: optionsWithDefault.end_date,
        },
        type: db.sequelize.QueryTypes.SELECT,
      })
      .then(function buidArrayState(state) {
        deviceFeaturesStates.push(state);
      });

    const mapOfState = new Map();
    deviceFeaturesStates[0].forEach((state) => {
      let tmpArray = mapOfState.get(state.device_feature_id);
      if (!tmpArray) {
        tmpArray = [];
      }
      tmpArray.push(state);
      mapOfState.set(state.device_feature_id, tmpArray);
    });

    devicesPlain.forEach((device) => {
      device.features.forEach((feature) => {
        if (mapOfState.get(feature.id)) {
          feature.device_feature_states = mapOfState.get(feature.id);
        }
      });
    });

    return devicesPlain;
  });

  return result;
}

module.exports = {
  getFeatureStates,
};
