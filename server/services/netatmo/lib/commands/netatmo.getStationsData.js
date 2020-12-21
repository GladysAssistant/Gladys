const logger = require('../../../../utils/logger');

/**
 * @description Handler Error from event
 * @returns devices
 * @example
 * getStationsData();
 */
async function getStationsData() {
  // we get the thermostats
  new Promise((resolve, reject) => {
    this.api.getStationsData((err, data) => {
      resolve(data);
    });
  })
  .then((stations) => {
    stations.forEach((station) => {
      this.newValueStation(station);
    });
  })
  .catch(() => {
    logger.info('Erreur getStationsData')
  })
}

module.exports = {
  getStationsData,
};
