const asyncMiddleware = require('../middlewares/asyncMiddleware');
const { EVENTS } = require('../../utils/constants');

module.exports = function SystemController(gladys) {
  /**
   * @api {post} /api/v1/system/info
   * @apiName getSystemInfos
   * @apiGroup System
   */
  async function getSystemInfos(req, res) {
    const infos = await gladys.system.getInfos();
    res.json(infos);
  }

  /**
   * @api {post} /api/v1/system/disk
   * @apiName getDiskUsage
   * @apiGroup System
   */
  async function getDiskSpace(req, res) {
    const diskSpace = await gladys.system.getDiskSpace();
    res.json(diskSpace);
  }

  /**
   * @api {get} /api/v1/system/container
   * @apiName getContainers
   * @apiGroup System
   */
  async function getContainers(req, res) {
    const containers = await gladys.system.getContainers();
    res.json(containers);
  }

  /**
   * @api {post} /api/v1/system/upgrade
   * @apiName installUpgrade
   * @apiGroup System
   */
  async function installUpgrade(req, res) {
    gladys.event.emit(EVENTS.SYSTEM.UPGRADE_CONTAINERS);
    res.json({
      success: true,
      message: 'Upgrade started',
    });
  }

  /**
   * @api {post} /api/v1/system/shutdown
   * @apiName shutdownSystem
   * @apiGroup System
   */
  async function shutdown(req, res) {
    res.json({
      success: true,
      message: 'System will shutdown soon',
    });
    gladys.system.shutdown();
  }

  /**
   * @api {post} /api/v1/system/vacuum
   * @apiName vacuumSystem
   * @apiGroup System
   */
  async function vacuum(req, res) {
    gladys.event.emit(EVENTS.SYSTEM.VACUUM);
    res.json({
      success: true,
      message: 'Vacuum started, system might be unresponsive for a while',
    });
  }

  return Object.freeze({
    installUpgrade: asyncMiddleware(installUpgrade),
    getSystemInfos: asyncMiddleware(getSystemInfos),
    getDiskSpace: asyncMiddleware(getDiskSpace),
    getContainers: asyncMiddleware(getContainers),
    shutdown: asyncMiddleware(shutdown),
    vacuum: asyncMiddleware(vacuum),
  });
};
