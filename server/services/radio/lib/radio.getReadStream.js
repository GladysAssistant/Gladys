const lame = require('@flat/lame');
const https = require('https');
const http = require('http');
const internetradio = require('node-internet-radio');
const logger = require('../../../utils/logger');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');
const { RADIO } = require('./utils/radio.constants');

/**
 * @description Build a promise with stream to read.
 * @param {object} read - Read implemention to ust (http or https).
 * @param {string} url - Url of stream.
 * @param {object} decoder - Decoder to use for decode stream.
 * @param {object} gladys - Gladys instance.
 * @returns {object} Promise with stream to read.
 * @example
 * buildReadStreamPromise(read, url, decoder, this.gladys);
 */
function buildReadStreamPromise(read, url, decoder, gladys) {
  return new Promise((resolve, reject) => {
    read.get(url, (res) => {
      // Check response status
      if (res.statusCode !== 200) {
        logger.warn(`Radio request (${url}) status code is ${res.statusCode}`);
        return;
      }

      res.on('data', async () => {
        const stationMetadata = await new Promise((resolveMeta, rejectMeta) => {
          internetradio.getStationInfo(url, (error, station) => {
            if (station) {
              resolveMeta(station);
            }
          });
        });

        if (stationMetadata) {
          gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
            type: WEBSOCKET_MESSAGE_TYPES.MUSIC.METADATA,
            payload: {
              provider: RADIO.SERVICE_NAME,
              title: stationMetadata.title,
            },
          });
        } else {
          gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
            type: WEBSOCKET_MESSAGE_TYPES.MUSIC.METADATA,
            payload: {
              provider: RADIO.SERVICE_NAME,
              title: '',
            },
          });
        }
      });

      // Add decoder to stream pipe
      resolve(res.pipe(decoder));
    });
  });
}

/**
 * @description Get read stream from radio url.
 * @param {string} url - Url of radio stream.
 * @returns {object} Read stream from url.
 * @example
 * getReadStream('http://example.com/myradio.mp3');
 */
async function getReadStream(url) {
  let read;
  if (url) {
    if (url.startsWith('https')) {
      read = https;
    } else if (url.startsWith('http')) {
      read = http;
    }
  }

  let result;
  if (read) {
    const decoder = new lame.Decoder();
    logger.trace(`Build read stream for url ${url}`);

    result = await buildReadStreamPromise(read, url, decoder, this.gladys);
  }

  return result;
}

module.exports = {
  getReadStream,
};
