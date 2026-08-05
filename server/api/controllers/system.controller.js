const asyncMiddleware = require('../middlewares/asyncMiddleware');
const { EVENTS } = require('../../utils/constants');
// How long a reboot/shutdown command is given to fail before the request is
// acknowledged: long enough to catch an immediate refusal, short enough not to
// keep the request open until the host actually goes down.
const HOST_POWER_ACK_DELAY_MS = 3000;

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
   * @api {post} /api/v1/system/reboot
   * @apiName rebootHost
   * @apiGroup System
   */
  async function rebootHost(req, res) {
    // A destructive action must not report a success it did not get: wait for
    // the command, so an immediate failure (polkit refusal, helper container
    // error) is surfaced to the user. But do not wait forever either: the host
    // may go down before the HTTP response is flushed, so acknowledge once the
    // command has been running for a short while without failing.
    await Promise.race([
      gladys.system.rebootHost(),
      new Promise((resolve) => {
        setTimeout(resolve, HOST_POWER_ACK_DELAY_MS);
      }),
    ]);
    res.json({
      success: true,
      message: 'Host will reboot soon',
    });
  }

  /**
   * @api {post} /api/v1/system/shutdown-host
   * @apiName shutdownHost
   * @apiGroup System
   */
  async function shutdownHost(req, res) {
    // Same trade-off as rebootHost above.
    await Promise.race([
      gladys.system.shutdownHost(),
      new Promise((resolve) => {
        setTimeout(resolve, HOST_POWER_ACK_DELAY_MS);
      }),
    ]);
    res.json({
      success: true,
      message: 'Host will shutdown soon',
    });
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

  /**
   * @api {get} /api/v1/system/logs Get a chunk of the Gladys container logs
   * @apiName getGladysLogs
   * @apiGroup System
   * @apiQuery {Number} [offset=0] Byte offset in the cached logs buffer.
   * @apiQuery {Number} [limit] Maximum number of bytes to return.
   * @apiQuery {Boolean} [refresh=false] Force refreshing the cached log buffer.
   */
  async function getGladysLogs(req, res) {
    const offset = req.query.offset !== undefined ? parseInt(req.query.offset, 10) : 0;
    const limit = req.query.limit !== undefined ? parseInt(req.query.limit, 10) : undefined;
    const refresh = req.query.refresh === 'true' || req.query.refresh === true;
    const result = await gladys.system.getGladysLogs({ offset, limit, refresh });
    res.json(result);
  }

  return Object.freeze({
    installUpgrade: asyncMiddleware(installUpgrade),
    getSystemInfos: asyncMiddleware(getSystemInfos),
    getDiskSpace: asyncMiddleware(getDiskSpace),
    getContainers: asyncMiddleware(getContainers),
    shutdown: asyncMiddleware(shutdown),
    rebootHost: asyncMiddleware(rebootHost),
    shutdownHost: asyncMiddleware(shutdownHost),
    vacuum: asyncMiddleware(vacuum),
    getGladysLogs: asyncMiddleware(getGladysLogs),
  });
};
