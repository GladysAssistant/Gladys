const { Op } = require('sequelize');
const { LTTB } = require('downsample');
const Promise = require('bluebird');
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
    raw: true,
    nest: true,
  };

  // Fix attributes (limit attibutes return in select request)
  if (optionsWithDefault.attributes_device && optionsWithDefault.attributes_device.length > 0) {
    queryParams.attributes = optionsWithDefault.attributes_device;
  }
  if (optionsWithDefault.attributes_device_feature && optionsWithDefault.attributes_device_feature.length > 0) {
    queryParams.include[0].attributes = optionsWithDefault.attributes_device_feature;
  }
  if (optionsWithDefault.attributes_device_room && optionsWithDefault.attributes_device_room.length > 0) {
    queryParams.include[1].attributes = optionsWithDefault.attributes_device_room;
  }

  // Search by feature selector (add feature.selector condition in where)
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
  const mapOfDeviceBySelector = new Map();

  // Build request for feature state info with OR condition
  if (devices && devices.length > 0) {
    const stateLightOrCondition = [];
    const stateOrCondition = [];

    const queryStateLightParams = {
      order: [['created_at', 'ASC']],
      raw: true,
    };
    const queryStateParams = {
      order: [['created_at', 'ASC']],
      raw: true,
    };

    await Promise.each(devices, async (device) => {
      if (device.features) {
        // Search feature state of current feature
        let beginStateSearchDate = optionsWithDefault.begin_date;

        // If column last_downsampling is explicitly asked
        // => part of data is extract from device_feature_state_light
        if (
          device.features.last_downsampling &&
          optionsWithDefault.attributes_device_feature &&
          optionsWithDefault.attributes_device_feature.length > 0 &&
          optionsWithDefault.attributes_device_feature.includes('last_downsampling')
        ) {
          stateLightOrCondition.push({
            device_feature_id: { [Op.eq]: device.features.id },
            created_at: { [Op.between]: [optionsWithDefault.begin_date, device.features.last_downsampling] },
          });
          beginStateSearchDate = device.features.last_downsampling;
        }

        stateOrCondition.push({
          device_feature_id: { [Op.eq]: device.features.id },
          created_at: { [Op.between]: [beginStateSearchDate, optionsWithDefault.end_date] },
        });

        mapOfDeviceBySelector.set(device.selector, {
          name: device.name,
          selector: device.selector,
          features: [],
          room: {
            name: device.room.name,
            selector: device.room.selector,
          },
        });
      }
    });

    // Put where condition in query params
    if (stateLightOrCondition && stateLightOrCondition.length > 1) {
      queryStateLightParams.where = {
        [Op.or]: stateLightOrCondition,
      };
    } else {
      const [first] = stateLightOrCondition;
      queryStateLightParams.where = first;
    }
    if (stateOrCondition && stateOrCondition.length > 1) {
      queryStateParams.where = {
        [Op.or]: stateOrCondition,
      };
    } else {
      const [first] = stateOrCondition;
      queryStateParams.where = first;
    }

    // execute query to get feature state
    // (of all feature , 1 request in featureSateLight table and 1 request in featureSate table)
    let featureStateLightMap;
    let featureStatetMap;
    if (stateLightOrCondition && stateLightOrCondition.length > 0) {
      const featureStateLight = await db.DeviceFeatureStateLight.findAll(queryStateLightParams);
      featureStateLightMap = featureStateLight.reduce((map, state) => {
        if (!map[state.device_feature_id]) {
          map[state.device_feature_id] = [];
        }
        map[state.device_feature_id].push(state);
        return map;
      }, {});
    }

    if (stateOrCondition && stateOrCondition.length > 0) {
      const featureState = await db.DeviceFeatureState.findAll(queryStateParams);
      featureStatetMap = featureState.reduce((map, state) => {
        if (!map[state.device_feature_id]) {
          map[state.device_feature_id] = [];
        }
        map[state.device_feature_id].push(state);
        return map;
      }, {});
    }

    await Promise.each(devices, async (device) => {
      if (device.features) {
        const tmpDevice = mapOfDeviceBySelector.get(device.selector);
        let tmpFeatureState = [];
        if (featureStateLightMap && featureStateLightMap[device.features.id]) {
          tmpFeatureState = tmpFeatureState.concat(featureStateLightMap[device.features.id]);
        }
        if (featureStatetMap && featureStatetMap[device.features.id]) {
          tmpFeatureState = tmpFeatureState.concat(featureStatetMap[device.features.id]);
        }

        // Downsample result to reduce nb of value in response
        // (reduce feture_state + feautre_state_light)
        let chartWidth = 100;
        let tmpTrend;
        if (options.maxValue) {
          chartWidth = options.maxValue;
        }
        if (
          tmpFeatureState &&
          tmpFeatureState.length > chartWidth &&
          options.downsample &&
          options.downsample === 'true'
        ) {
          const featureValuesArray = [];
          const newFeatureStateArray = [];

          await Promise.each(tmpFeatureState, (state) => {
            newFeatureStateArray.push({
              x: new Date(state.created_at).getTime(),
              y: state.value,
            });
            featureValuesArray.push(state.value);
          });

          let smoothFeatureStates = newFeatureStateArray;
          if (newFeatureStateArray.length > chartWidth) {
            smoothFeatureStates = LTTB(newFeatureStateArray, chartWidth);
          }
          tmpFeatureState = smoothFeatureStates;
          tmpTrend = newFeatureStateArray[newFeatureStateArray.length - 1] - newFeatureStateArray[0];
        }

        tmpDevice.features.push({
          id: device.features.id,
          name: device.features.name,
          selector: device.features.selector,
          unit: device.features.unit,
          last_value: device.features.last_value,
          last_value_changed: device.features.last_value_changed,
          trend: tmpTrend,
          device_feature_states: tmpFeatureState,
        });
      }
    });
  }

  return Array.from(mapOfDeviceBySelector.values());
}

module.exports = {
  getFeatureStates,
};
