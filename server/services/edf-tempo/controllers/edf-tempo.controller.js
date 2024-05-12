const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');

module.exports = function EdfTempoController(getEdfTempoStates) {
  /**
   * @api {get} /api/v1/service/edf-tempo/state Get EDF tempo state
   * @apiName getEdfTempoStates
   * @apiGroup Ecowatt
   */
  async function getEdfTempoStatesController(req, res) {
    const data = await getEdfTempoStates();
    res.json(data);
  }

  return {
    'get /api/v1/service/edf-tempo/state': {
      authenticated: true,
      controller: asyncMiddleware(getEdfTempoStatesController),
    },
  };
};
