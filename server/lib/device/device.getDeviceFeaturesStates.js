const { Op } = require('sequelize');
const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');

const DEFAULT_OPTIONS = {
  skip: 0,
  order_dir: 'ASC',
  order_by: 'created_at',
};

/**
 * @description Get all features states aggregates.
 * @param {string} selector - Device selector.
 * @param {Object} [options] - Options of the query.
 * @param {string} [options.from] - Start date in UTC format "yyyy-mm-ddThh:mm:ss:sssZ"
 * or "yyyy-mm-dd hh:mm:ss:sss" (GMT time).
 * @param {string} [options.to] - End date in UTC format "yyyy-mm-ddThh:mm:ss:sssZ"
 * or "yyyy-mm-dd hh:mm:ss:sss" (GMT time).
 * @param {number} [options.take] - Number of elements to return.
 * @param {number} [options.skip] - Number of elements to skip.
 * @param {string} [options.attributes] - Possible values (separated by a comma ',' if several): 'id',
 * 'device_feature_id', 'value', 'created_at' and 'updated_at'. Leave empty to have all the columns.
 * @returns {Promise<Object>} - Resolve with an array of data.
 * @example
 * device.getDeviceFeaturesStates('test-device', [from: '2022-03-31T00:00:00.000Z', to: '2022-03-31T23:59:59.999Z',
 * take: 100, skip: 10, attributes: 'id,value,created_at']);
 */
async function getDeviceFeaturesStates(selector, options) {
  const deviceFeature = this.stateManager.get('deviceFeature', selector);
  if (deviceFeature === null) {
    throw new NotFoundError('DeviceFeature not found');
  }
  if (options.from === undefined) {
    throw new NotFoundError('Start date missing');
  }

  // Default from date is one week ago
  const fromDate = new Date(options.from);
  // Default end date is now
  const toDate = options.to ? new Date(options.to) : new Date();

  const optionsWithDefault = Object.assign({}, DEFAULT_OPTIONS, options);

  const queryParams = {
    raw: true,
    where: {
      device_feature_id: deviceFeature.id,
      created_at: {
        [Op.gte]: fromDate,
        [Op.lte]: toDate,
      },
    },
    offset: optionsWithDefault.skip,
    order: [[optionsWithDefault.order_by, optionsWithDefault.order_dir]],
  };

  // take is not a default
  if (optionsWithDefault.take !== undefined) {
    queryParams.limit = optionsWithDefault.take;
  }

  if (optionsWithDefault.attributes !== undefined) {
    queryParams.attributes = optionsWithDefault.attributes.split(',');
  }

  const states = await db.DeviceFeatureState.findAll(queryParams);

  return states;
}

module.exports = {
  getDeviceFeaturesStates,
};
