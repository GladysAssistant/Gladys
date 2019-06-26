const { Op } = require('sequelize');
const Sequelize = require('sequelize');
const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');

const DEFAULT_OPTIONS = {
  take: 20,
  skip: 0,
  order_dir: 'ASC',
  order_by: 'name',
};

/**
 * @description Get list of device
 * @param {Object} [options] - Options of the query.
 * @example
 * const devices = await gladys.device.get({
 *  take: 20,
 *  skip: 0
 * });
 */
async function get(options) {
  const optionsWithDefault = Object.assign({}, DEFAULT_OPTIONS, options);

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
    limit: optionsWithDefault.take,
    offset: optionsWithDefault.skip,
    order: [[optionsWithDefault.order_by, optionsWithDefault.order_dir]],
  };

  if (optionsWithDefault.search) {
    queryParams.where = Sequelize.where(Sequelize.fn('lower', Sequelize.col('name')), {
      [Op.like]: `%${optionsWithDefault.search}%`,
    });
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

  const devices = await db.Device.findAll(queryParams);

  const devicesPlain = devices.map((device) => device.get({ plain: true }));

  return devicesPlain;
}

module.exports = {
  get,
};
