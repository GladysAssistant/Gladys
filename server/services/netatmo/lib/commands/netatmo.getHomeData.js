const axios = require('axios');
const logger = require('../../../../utils/logger');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');
const { NotFoundError } = require('../../../../utils/coreErrors');
/**
 * @description Get Home Data
 * @param {string} mode - Data received.
 * @example
 * getHomeData();
 */
async function getHomeData(mode = '') {
  // we get the cameras gethomedata
  let response;
  try {
    response = await axios.post(`${this.baseUrl}/api/gethomedata`, { access_token: this.token });
    if (response.data.body.homes !== undefined) {
      response.data.body.homes.forEach((home) => {
        if (home.cameras !== undefined) {
          home.cameras.forEach((camera) => {
            const sid = camera.id;
            if (this.devices[sid] === undefined || mode === 'refresh') {
              this.newValueCamera(camera);
            }
            this.devices[sid] = camera;
          });
        } else {
          logger.info('NETATMO: No data cameras in getHomeData (camera)');
          throw new NotFoundError('NETATMO: No data cameras in getHomeData (camera)');
        }
      });
    } else {
      throw new NotFoundError('NETATMO: No data homes in getHomeData (camera)');
    }
  } catch (err) {
    logger.error(`Error on getHomeData (camera) - ${err}`);
    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.NETATMO.ERRORDATA,
      payload: `NETATMO: Error on getHomeData (camera) - ${err}`,
    });
    throw new NotFoundError(`NETATMO: Error on getHomeData (camera) - ${err}`);
  }
}

module.exports = {
  getHomeData,
};
