const asyncMiddleware = require('../middlewares/asyncMiddleware');
const logger = require('../../utils/logger');


module.exports = function EventlogController(gladys) {

  async function get(req, res) {
    const page = req.query.page || 1;
    const perPage = req.query.per_page || 15;
    const logs = await gladys.event.logger.get((page - 1) * perPage, page * perPage -1);
    logger.debug(`page ${page} perPage ${perPage} start ${(page - 1) * perPage} end ${page * perPage -1}`)
    res.json(logs);
  }

  return Object.freeze({
    get: asyncMiddleware(get),
  });
};
