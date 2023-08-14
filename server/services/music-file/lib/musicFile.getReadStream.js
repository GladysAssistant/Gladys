const fs = require('fs');
const path = require('path');
const lame = require('@euguuu/lame');
const wav = require('wav');
const mm = require('music-metadata');
const logger = require('../../../utils/logger');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');
const { MUSICFILE } = require('./utils/musicFile.constants');

/**
 * @description Get read stream from music file.
 * @param {string} filePath - File path of music to decode.
 * @returns {object} Read stream from music file.
 * @example
 * getReadStream(music);
 */
function getReadStream(filePath) {
  // Create readStream with chunk size limit to interact (stop, pause, ... ) with speaker during play
  let read;
  if (filePath && fs.existsSync(filePath.trim())) {
    read = fs.createReadStream(filePath.trim(), { highWaterMark: 10 * 1024 });
  } else {
    return undefined;
  }
  const fileExt = path.extname(filePath.trim()).toLowerCase();
  // Choose decoder
  let decoder;
  switch (fileExt) {
    case '.mp3':
      decoder = new lame.Decoder();
      break;
    case '.wav':
      decoder = new wav.Reader();
      break;
    default:
      logger.warn(`File extension ${fileExt} is not supported.`);
  }

  read.on('data', async () => {
    const metadata = await mm.parseFile(filePath.trim(), { duration: true });
    const cover = await mm.selectCover(metadata.common.picture);
    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.MUSIC.METADATA,
      payload: {
        provider: MUSICFILE.SERVICE_NAME,
        title: metadata.common.title,
        artist: metadata.common.artist,
        album: metadata.common.album,
        duration: metadata.format.duration,
        cover,
      },
    });
    read.metadataAlreadySent = true;
  });

  // Add decoder to stream pipe
  return read.pipe(decoder);
}

module.exports = {
  getReadStream,
};
