const asyncMiddleware = require('../middlewares/asyncMiddleware');


module.exports = function EventlogController(gladys) {

  async function get(req, res) {
    const page = req.query.page || 1;
    const perPage = req.query.perPage || 15;
    const logs = await gladys.event.logger.get((page - 1) * perPage, page * perPage);
    res.json(logs);
  }

  return Object.freeze({
    get: asyncMiddleware(get),
  });
};
