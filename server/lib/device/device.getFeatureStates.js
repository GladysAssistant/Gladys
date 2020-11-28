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
 * const devices = await gladys.device.get({
 *  take: 20,
 *  skip: 0
 * });
 */
async function getFeatureStates(options) {
  const optionsWithDefault = Object.assign({}, DEFAULT_OPTIONS, options);

  const queryParams = {
    include: [
      {
        model: db.DeviceFeature,
        as: 'features',
        include: [{
          model: db.DeviceFeatureState,
          as: 'device_feature_states',
          required: false
        }]
      }
    ],
    offset: optionsWithDefault.skip,
    order: [[optionsWithDefault.order_by, optionsWithDefault.order_dir]],
  };

  // search by devide selector
  if(options.device_selector){
    queryParams.where = {
      selector: options.device_selector,
    };
  }

  // search by feature selector
  if(options.device_feature_selector){
    queryParams.include[0].where = {
      selector: options.device_feature_selector,
    };
  }

  // search by device feature category
  if (optionsWithDefault.device_feature_category) {
    queryParams.include[0].where = {
      category: optionsWithDefault.device_feature_category,
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

  const devices = await db.Device.findAll(queryParams);

  const devicesPlain = devices.map((device) => device.get({ plain: true }));

  return devicesPlain;
}

module.exports = {
  getFeatureStates,
};
