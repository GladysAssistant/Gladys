const { Op } = require('sequelize');
const Sequelize = require('sequelize');
const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');

const DEFAULT_OPTIONS = {
  skip: 0,
  order_dir: 'ASC',
  order_by: 'name',
};

/**
 * @description Get list of device feature states
 * @param {Object} [options] - Options of the query.
 * @example
 * const devices = await gladys.device.getFeatureStates({
 *  device_feature_selector: 'test-selector'
 * });
 */
async function getFeatureStates(options) {
  const optionsWithDefault = Object.assign({}, DEFAULT_OPTIONS, options);

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
    order: [[optionsWithDefault.order_by, optionsWithDefault.order_dir]],
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
    if(optionsWithDefault.device_feature_selector.indexOf(',') > 0){
      queryParams.include[0].where = {
        selector: { [Op.in]: optionsWithDefault.device_feature_selector },
      };
    } else {
      queryParams.include[0].where = {
        selector: { [Op.eq]: optionsWithDefault.device_feature_selector },
      };
    }
  }

  // take is not a default
  if (optionsWithDefault.take !== undefined) {
    queryParams.limit = optionsWithDefault.take;
  }

  const devices = await db.Device.findAll(queryParams);

  const devicesPlain = devices.map((device) => device.get({ plain: true }));

  // search feature state
  const queryStateParams = {
    offset: optionsWithDefault.skip,
    order: [['created_at', optionsWithDefault.order_dir]],
  };

  if (optionsWithDefault.begin_date || optionsWithDefault.end_date) {
    queryStateParams.where = { device_feature_id: {},  created_at: {} };
    if (optionsWithDefault.begin_date && !optionsWithDefault.end_date) {
      queryStateParams.where.created_at = { [Op.gte]: optionsWithDefault.begin_date };
    }
    if (!optionsWithDefault.begin_date && optionsWithDefault.end_date) {
      queryStateParams.where.created_at = { [Op.gte]: optionsWithDefault.end_date };
    }
    if (optionsWithDefault.begin_date && optionsWithDefault.end_date) {
      queryStateParams.where.created_at = {
        [Op.between]: [optionsWithDefault.begin_date, optionsWithDefault.end_date],
      };
    }
  } else {
    queryStateParams.where = { device_feature_id: {} };
  }

  // Build list of features id
  let featuresId = '';
  devicesPlain.forEach(device => {
    device.features.forEach(feature => {
      if(featuresId.length > 0){
        featuresId += ', ';
      }
      featuresId += feature.id;
      feature.device_feature_states = [];
    });
  });
  // Put where condition on feature id
  if(featuresId.indexOf(',') > 0){
    queryStateParams.where.device_feature_id ={
      [Op.in]: featuresId
    };
  }else{
    queryStateParams.where.device_feature_id ={
      [Op.eq]: featuresId
    };
  }

  queryStateParams.attributes = ['device_feature_id', 'value', 'created_at']; 

  const deviceFeaturesStates = await db.DeviceFeatureState.findAll(queryStateParams);

  const deviceFeaturesStatesPlain = 
    deviceFeaturesStates.map((deviceFeaturesState) => deviceFeaturesState.get({ plain: true }));
  
  const mapOfState = new Map();
  deviceFeaturesStatesPlain.forEach(state => {
    let tmpArray = mapOfState.get(state.device_feature_id);
    if(!tmpArray){
      tmpArray = [];
    }
    tmpArray.push(state);
    mapOfState.set(state.device_feature_id, tmpArray);
  });

  devicesPlain.forEach(device => {
    device.features.forEach(feature => {
      if(mapOfState.get(feature.id)){
        feature.device_feature_states = mapOfState.get(feature.id);
      }
    });
  });

  return devicesPlain;
}

module.exports = {
  getFeatureStates,
};
