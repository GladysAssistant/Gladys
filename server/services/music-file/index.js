const { SYSTEM_VARIABLE_NAMES, MUSIC } = require('../../utils/constants');
const logger = require('../../utils/logger');
const { MUSICFILE } = require('./lib/utils/musicFile.constants');
const MusicFileController = require('./api/musicFile.controller');
const MusicFileHandler = require('./lib');

module.exports = function MusicFileService(gladys, serviceId) {
  const musicFileHandler = new MusicFileHandler(gladys);

  /**
   * @public
   * @description This function starts the service.
   * @example
   * gladys.services.musicFile.start();
   */
  async function start() {
    logger.info('Starting Music File service');

    const musicFileServiceEnabled = await gladys.variable.getValue(SYSTEM_VARIABLE_NAMES.GLADYS_MUSIC_SERVICES_ENABLED);
    if (
      musicFileServiceEnabled &&
      JSON.parse(musicFileServiceEnabled)[MUSICFILE.SERVICE_NAME] === MUSIC.PROVIDER.STATUS.ENABLED
    ) {
      // Start music local handler (only if default directory is configured)
      const defaultFolder = await gladys.variable.getValue(MUSICFILE.DEFAULT_FOLDER, serviceId);
      logger.debug(`Provider ${MUSICFILE.SERVICE_NAME} is enabled, scan folder ${defaultFolder}.̀`);
      if (defaultFolder) {
        const readSubDirectory = await gladys.variable.getValue(MUSICFILE.READ_SUBFOLDER, serviceId);
        if (readSubDirectory) {
          musicFileHandler.readSubDirectory = readSubDirectory;
        }
        musicFileHandler.defaultFolder = defaultFolder;
        musicFileHandler.readSubDirectory = readSubDirectory;
        musicFileHandler.init();
      }
    }
  }

  /**
   * @public
   * @description This function stops the service.
   * @example
   * gladys.services.musicFile.stop();
   */
  async function stop() {
    logger.info('Stopping Music File service');
  }

  return Object.freeze({
    start,
    stop,
    soundHandler: musicFileHandler,
    controllers: MusicFileController(musicFileHandler),
  });
};
