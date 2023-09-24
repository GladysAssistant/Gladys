const { Op } = require('sequelize');
const Sequelize = require('sequelize');
const db = require('../../models');
const { isNumeric } = require('../../utils/device');
const { NotFoundError } = require('../../utils/coreErrors');
const { SYSTEM_VARIABLE_NAMES } = require('../../utils/constants');

const DEFAULT_OPTIONS = {
  skip: 0,
  order_dir: 'ASC',
  order_by: 'name',
};

const DEFAULT_DEVICE_STATE_NUMBER_OF_HOURS_BEFORE_STATE_IS_OUTDATED = 48;

/**
 * @description Get list of device.
 * @param {object} [options] - Options of the query.
 * @returns {Promise<Array>} Resolve with list of devices.
 * @example
 * const devices = await gladys.device.get({
 *  take: 20,
 *  skip: 0
 * });
 */
async function get(options) {
  const optionsWithDefault = { ...DEFAULT_OPTIONS, ...options };

  const queryParams = {
    include: [
      {
        model: db.DeviceFeature,
        as: 'features',
      },
      {
        model: db.DeviceParam,
        as: 'params',
      },
      {
        model: db.Room,
        as: 'room',
      },
      {
        model: db.Service,
        as: 'service',
      },
    ],
    offset: optionsWithDefault.skip,
    order: [[optionsWithDefault.order_by, optionsWithDefault.order_dir]],
  };

  // search by device feature category
  if (optionsWithDefault.device_feature_category) {
    queryParams.include[0].where = {
      category: optionsWithDefault.device_feature_category,
    };
  }

  // search by device feature selectors
  if (optionsWithDefault.device_feature_selectors) {
    queryParams.include[0].where = {
      [Op.or]: optionsWithDefault.device_feature_selectors.split(',').map((selector) => ({
        selector,
      })),
    };
  }

  // search by device feature type
  if (optionsWithDefault.device_feature_type) {
    const condition = {
      type: optionsWithDefault.device_feature_type,
    };
    queryParams.include[0].where = queryParams.include[0].where
      ? Sequelize.and(queryParams.include[0].where, condition)
      : condition;
  }

  // take is not a default
  if (optionsWithDefault.take !== undefined) {
    queryParams.limit = optionsWithDefault.take;
  }

  if (optionsWithDefault.search) {
    queryParams.where = {
      [Op.or]: [
        Sequelize.where(Sequelize.fn('lower', Sequelize.col('t_device.name')), {
          [Op.like]: `%${optionsWithDefault.search}%`,
        }),
        Sequelize.where(Sequelize.fn('lower', Sequelize.col('t_device.external_id')), {
          [Op.like]: `%${optionsWithDefault.search}%`,
        }),
      ],
    };
  }

  if (optionsWithDefault.service) {
    const service = await this.serviceManager.getLocalServiceByName(optionsWithDefault.service);
    if (!service) {
      throw new NotFoundError('SERVICE_NOT_FOUND');
    }
    const condition = {
      service_id: service.id,
    };
    queryParams.where = queryParams.where ? Sequelize.and(queryParams.where, condition) : condition;
  }

  if (optionsWithDefault.model) {
    const condition = {
      model: optionsWithDefault.model,
    };
    queryParams.where = queryParams.where ? Sequelize.and(queryParams.where, condition) : condition;
  }

  // A device state is not valid forever, we need to determine when a value is "outdated"
  // The default is 48 hours, but it can be changed with this setting
  let numberOfHoursBeforeStateIsOutdated = await this.variable.getValue(
    SYSTEM_VARIABLE_NAMES.DEVICE_STATE_NUMBER_OF_HOURS_BEFORE_STATE_IS_OUTDATED,
  );
  if (!numberOfHoursBeforeStateIsOutdated) {
    numberOfHoursBeforeStateIsOutdated = DEFAULT_DEVICE_STATE_NUMBER_OF_HOURS_BEFORE_STATE_IS_OUTDATED;
  } else {
    numberOfHoursBeforeStateIsOutdated = parseInt(numberOfHoursBeforeStateIsOutdated, 10);
  }

  const devices = await db.Device.findAll(queryParams);

  const devicesPlain = devices.map((device) => {
    const rawDevice = device.get({ plain: true });
    // We fill the "last_value_is_too_old" attribute for each feature
    rawDevice.features.forEach((feature) => {
      let lastValueInTimestamp = new Date(feature.last_value_changed).getTime();
      if (!isNumeric(lastValueInTimestamp)) {
        lastValueInTimestamp = 0;
      }
      const tooOldTimestamp = Date.now() - numberOfHoursBeforeStateIsOutdated * 60 * 60 * 1000;
      const lastValueIsToOld = lastValueInTimestamp < tooOldTimestamp;
      feature.last_value_is_too_old = lastValueIsToOld;
    });
    return rawDevice;
  });

  return devicesPlain;
}

module.exports = {
  get,
};
