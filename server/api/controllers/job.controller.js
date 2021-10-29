const asyncMiddleware = require('../middlewares/asyncMiddleware');

/**
 * @apiDefine JobParam
 * @apiParam {String} type job type
 * @apiParam {String} status status of the job.
 * @apiParam {Number} progress Job progress in percentage.
 * @apiParam {Object} data Data fields about the job
 */

module.exports = function JobController(gladys) {
  /**
   * @api {get} /api/v1/job get
   * @apiName get
   * @apiGroup Job
   * @apiSuccessExample {json} Success-Example
   * [{
   *   "id": "7932e6b3-b944-49a9-8d63-b98b8ecb2509",
   *   "type": "hourly-device-state-aggregate",
   *   "status": "success",
   *   "progress": 100,
   *   "data": {},
   *   "updated_at": "2019-05-09T03:43:54.247Z",
   *   "created_at": "2019-05-09T03:43:54.247Z"
   * }]
   */
  async function get(req, res) {
    const jobs = await gladys.job.get(req.query);
    res.json(jobs);
  }

  return Object.freeze({
    get: asyncMiddleware(get),
  });
};
