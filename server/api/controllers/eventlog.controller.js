const asyncMiddleware = require('../middlewares/asyncMiddleware');


module.exports = function EventlogController(gladys) {

  async function get(req, res) {
    const logs = await gladys.event.logger.get();
    res.json(logs);
  }

  return Object.freeze({
    get: asyncMiddleware(get),
  });
};
