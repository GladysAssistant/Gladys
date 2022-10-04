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
   * @api {post} /api/v1/system/upgrade/download
   * @apiName getContainers
   * @apiGroup System
   */
  async function downloadUpgrade(req, res) {
    gladys.event.emit(EVENTS.SYSTEM.DOWNLOAD_UPGRADE, req.body.tag);
    res.json({
      success: true,
      message: 'Download is in progress',
    });
  }

  /**
   * @api {get} /api/v1/system/upgrade/download/status
   * @apiName getContainers
   * @apiGroup System
   */
  async function getUpgradeDownloadStatus(req, res) {
    res.json({
      error: gladys.system.downloadUpgradeError,
      upgrade_finished: gladys.system.downloadUpgradeFinished,
      last_event: gladys.system.downloadUpgradeLastEvent,
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
    downloadUpgrade: asyncMiddleware(downloadUpgrade),
    getSystemInfos: asyncMiddleware(getSystemInfos),
    getDiskSpace: asyncMiddleware(getDiskSpace),
    getContainers: asyncMiddleware(getContainers),
    shutdown: asyncMiddleware(shutdown),
    getUpgradeDownloadStatus: asyncMiddleware(getUpgradeDownloadStatus),
    vacuum: asyncMiddleware(vacuum),
  });
};
