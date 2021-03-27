const { Op } = require('sequelize');
const { LTTB } = require('downsample');
const db = require('../../models');
const logger = require('../../utils/logger');

const MAX_STATE_BY_DAY = 100;

/**
 * @description Downsampling of feature device states (for yesterday).
 * @example
 * device.downsamplingStates();
 */
async function downsamplingStates() {
  logger.debug('Downsampling device feature states of yesterday ...');

  await db.sequelize.transaction(async (t) => {
    // Build query for get all features id
    const featuresQueryParams = {
      attributes: ['id', 'name', 'last_downsampling', 'created_at'],
      raw: true,
    };

    const deviceFeatures = await db.DeviceFeature.findAll(featuresQueryParams, { transaction: t });
    logger.trace('List of features to treat: ', deviceFeatures);

    deviceFeatures.forEach(async (feature) => {
      // date interval
      let beginDate;
      if (feature.last_downsampling) {
        beginDate = new Date(feature.last_downsampling);
      } else {
        beginDate = new Date(feature.created_at);
      }
      beginDate.setHours(0, 0, 0, 0);

      const endDate = new Date();
      endDate.setHours(0, 0, 0, 0);

      logger.debug(`Date interval of state to treat: ${beginDate} to ${endDate}`);

      // Build query for get yesterday feature states of feature
      const statesQueryParams = {
        raw: true,
        where: {
          device_feature_id: { [Op.eq]: feature.id },
          created_at: { [Op.between]: [beginDate, endDate] },
        },
        order: [['created_at', 'ASC']],
      };

      // Delete possible featue state light in conflict
      const queryInterface = await db.sequelize.getQueryInterface();
      queryInterface.bulkDelete('t_device_feature_state_light', {
        device_feature_id: { [Op.eq]: feature.id },
        created_at: { [Op.between]: [beginDate, endDate] },
      });

      // Get feature state and downsample it to save in feature state light
      await db.DeviceFeatureState.findAll(statesQueryParams, { transaction: t }).then((data) => {
        logger.debug(data.length);

        if (data.length > 0) {
          // Split state by day to treat downsampling day by day
          const mapOfFeatureState = new Map();
          data.forEach((state) => {
            const currentDayStateDate = new Date(state.created_at);
            currentDayStateDate.setHours(0, 0, 0, 0);

            if (!mapOfFeatureState.get(currentDayStateDate.getTime())) {
              mapOfFeatureState.set(currentDayStateDate.getTime(), []);
            }
            mapOfFeatureState.get(currentDayStateDate.getTime()).push(state);
          });

          mapOfFeatureState.forEach(async (value) => {
            if (value.length > MAX_STATE_BY_DAY) {
              const newFeatureStateArray = [];
              value.forEach((state) => {
                newFeatureStateArray.push({
                  x: new Date(state.created_at).getTime(),
                  y: state.value,
                });
              });

              const smoothFeatureStates = LTTB(newFeatureStateArray, MAX_STATE_BY_DAY);
              // Rebuild feature state list
              const featureStatesToSave = [];
              smoothFeatureStates.forEach((state) => {
                featureStatesToSave.push({
                  device_feature_id: feature.id,
                  created_at: state.x,
                  value: state.y,
                });
              });

              await db.DeviceFeatureStateLight.bulkCreate(featureStatesToSave);
            } else {
              // In this case all feature state was seed in feature state light
              await db.DeviceFeatureStateLight.bulkCreate(value);
            }

            // Change date of downsampling
            await db.DeviceFeature.update(
              { last_downsampling: value[value.length - 1].created_at },
              {
                where: {
                  id: feature.id,
                },
              },
            );
          });
        }
      });
    });
  });
}

module.exports = {
  downsamplingStates,
};
