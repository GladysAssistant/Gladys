const asyncMiddleware = require('../middlewares/asyncMiddleware');
const { EVENTS } = require('../../utils/constants');

module.exports = function DockerController(gladys) {
  /**
   * @api {get} /api/v1/docker/container/list
   * @apiName getContainers
   * @apiGroup Docker
   */
  async function getContainers(req, res) {
    const containers = await gladys.docker.getContainers();
    res.json(containers);
  }

  /**
   * @api {post} /api/v1/docker/container/run
   * @apiName runContainer
   * @apiGroup Docker
   */
  async function runContainer(req, res) {
    const container = await gladys.docker.runContainer(req.params.container_options);
    res.json(container);
  }

  /**
   * @api {post} /api/v1/docker/container/:container_name/start
   * @apiName startContainer
   * @apiGroup Docker
   */
  async function startContainer(req, res) {
    const container = await gladys.docker.startContainer(req.params.container_name);
    res.json(container);
  }

  /**
   * @api {post} /api/v1/docker/container/:container_name/stop
   * @apiName stopContainer
   * @apiGroup Docker
   */
  async function stopContainer(req, res) {
    const container = await gladys.docker.stopContainer(req.params.container_name);
    res.json(container);
  }

  return Object.freeze({
    getContainers: asyncMiddleware(getContainers),
    runContainer: asyncMiddleware(runContainer),
    startContainer: asyncMiddleware(startContainer),
    stopContainer: asyncMiddleware(stopContainer),
  });
};
