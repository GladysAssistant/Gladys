const logger = require('../../../../utils/logger');

/**
 * @description Handler Error from event
 * @returns devices
 * @example
 * getHealthyHomeCoachData();
 */
async function getHealthyHomeCoachData() {
  // we get the thermostats
  new Promise((resolve, reject) => {
    this.api.getHealthyHomeCoachData((err, data) => {
      resolve(data);
    });
  })
  .then((homeCoaches) => {
    homecoachs.forEach((homecoach) => {
      this.newValueHomeCoach(homecoach);
    });
  })
  .catch(() => {
    logger.info('Erreur getHealthyHomeCoachData')
  })
}

module.exports = {
  getHealthyHomeCoachData,
};
