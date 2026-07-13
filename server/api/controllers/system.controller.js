const fs = require('fs');
const path = require('path');
const fse = require('fs-extra');
const asyncMiddleware = require('../middlewares/asyncMiddleware');
const { EVENTS } = require('../../utils/constants');
const logger = require('../../utils/logger');

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
   * @api {get} /api/v1/system/backup/local
   * @apiName localBackup
   * @apiGroup System
   */
  async function localBackup(req, res) {
    const filePath = await gladys.system.createLocalBackup();
    const fileName = path.basename(filePath);
    const cleanup = () => fse.remove(path.dirname(filePath)).catch(() => {});

    // res.download() handles stream lifecycle correctly (no uncaught 'error' on closed res)
    res.download(filePath, fileName, (err) => {
      cleanup();
      if (err && !res.headersSent) {
        logger.error('Local backup download error', err);
      }
    });
  }

  /**
   * @api {post} /api/v1/system/backup/local/restore
   * @apiName localBackupRestore
   * @apiGroup System
   */
  async function localBackupRestore(req, res) {
    const uploadDir = path.join(gladys.config.tempFolder, 'restore-upload');
    await fse.ensureDir(uploadDir);
    const archiveFilePath = path.join(uploadDir, `restore-${Date.now()}.tar.gz`);

    // Stream the raw request body (sent as application/gzip) to a temp file
    await new Promise((resolve, reject) => {
      const writeStream = fs.createWriteStream(archiveFilePath);
      req.pipe(writeStream);
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
      req.on('error', reject);
    });

    // Respond immediately — restore will shut down the process when done
    res.json({ success: true, message: 'Restore started, Gladys will restart shortly' });

    // Run restore asynchronously so the response is sent before shutdown
    gladys.system.restoreLocalBackup(archiveFilePath).catch((err) => {
      logger.error('Local restore failed', err);
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
    vacuum: asyncMiddleware(vacuum),
    localBackup: asyncMiddleware(localBackup),
    localBackupRestore: asyncMiddleware(localBackupRestore),
    getGladysLogs: asyncMiddleware(getGladysLogs),
  });
};
