const asyncMiddleware = require('../middlewares/asyncMiddleware');

/**
 * @description Energy price REST controller.
 * @param {object} gladys - Gladys service container.
 * @returns {object} Controller with CRUD handlers.
 */
module.exports = function EnergyPriceController(gladys) {
  /**
   * @description List energy prices.
   * @param {object} req - Express request.
   * @param {object} res - Express response.
   * @returns {Promise<void>} Nothing.
   */
  async function get(req, res) {
    const prices = await gladys.energyPrice.get(req.query || {});
    res.json(prices);
  }

  /**
   * @description Create a new energy price.
   * @param {object} req - Express request.
   * @param {object} res - Express response.
   * @returns {Promise<void>} Nothing.
   */
  async function create(req, res) {
    const price = await gladys.energyPrice.create(req.body);
    res.status(201).json(price);
  }

  /**
   * @description Update an existing energy price by selector.
   * @param {object} req - Express request.
   * @param {object} res - Express response.
   * @returns {Promise<void>} Nothing.
   */
  async function update(req, res) {
    const price = await gladys.energyPrice.update(req.params.selector, req.body);
    res.json(price);
  }

  /**
   * @description Delete an energy price by selector.
   * @param {object} req - Express request.
   * @param {object} res - Express response.
   * @returns {Promise<void>} Nothing.
   */
  async function destroy(req, res) {
    await gladys.energyPrice.destroy(req.params.selector);
    res.json({ success: true });
  }

  return Object.freeze({
    get: asyncMiddleware(get),
    create: asyncMiddleware(create),
    update: asyncMiddleware(update),
    destroy: asyncMiddleware(destroy),
  });
};
