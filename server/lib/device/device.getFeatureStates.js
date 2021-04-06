const { Op } = require('sequelize');
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
    nest: true 
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
console.log(devices);
  const deviceResult =[];

  // Build request with OR condition
  if (devices && devices.length > 0) { 
    await Promise.each(devices, async (device) => { 

      if (device.features && device.features.length > 0) {

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

        await Promise.each(device.features, async (feature) => {
          // Search feature state of current feature
          let beginStateSearchDate = optionsWithDefault.begin_date;

          // If column last_downsampling is explicitly asked
          // => part of data is extract from device_feature_state_light
          if (
            feature.last_downsampling &&
            optionsWithDefault.attributes_device_feature &&
            optionsWithDefault.attributes_device_feature.length > 0 &&
            optionsWithDefault.attributes_device_feature.includes('last_downsampling')
          ) { 
            stateLightOrCondition.push({
              device_feature_id: { [Op.eq]: feature.id },
              created_at: { [Op.between]: [optionsWithDefault.begin_date, feature.last_downsampling] },
            });
            beginStateSearchDate = feature.last_downsampling;
          }

          stateOrCondition.push({
            device_feature_id: { [Op.eq]: feature.id },
            created_at: { [Op.between]: [beginStateSearchDate, optionsWithDefault.end_date] },
          });


        });  

        // Put where condition in query params
        if(stateLightOrCondition && stateLightOrCondition.length > 1){
          queryStateLightParams.where = {
            $or: stateLightOrCondition
          };
        }else{
          const [first] = stateLightOrCondition;
          queryStateLightParams.where = first;
        } 
        if(stateOrCondition && stateOrCondition.length > 1){
          queryStateParams.where = {
            $or: stateOrCondition
          };
        }else{
          const [first] = stateOrCondition;
          queryStateParams.where = first;
        } 


// TODO : recup toutes les state et les mettre dans le device result
 
        const featureStateLight = await db.DeviceFeatureStateLight.findAll(queryStateLightParams);
        console.log(featureStateLight);
        const featureLight = await db.DeviceFeatureState.findAll(queryStateParams); 
        console.log(featureLight);

      }

    });
  }

  console.log(deviceResult);
  return deviceResult;
}

module.exports = {
  getFeatureStates,
};
