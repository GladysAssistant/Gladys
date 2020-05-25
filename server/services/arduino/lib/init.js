const logger = require('../../../utils/logger');

const { listen } = require('./listen');

/**
 * @description Init arduino devices
 * @example
 * init();
 */
async function init() {
  try {
    const gladys = this.gladys;

    const list = await this.gladys.device.get({
      service: 'arduino',
      model: null
    });

    let arduinoList = [];
    list.forEach(element => {
      if (element.model === 'card') {
        arduinoList.push(element);
      }
    });

    arduinoList.forEach(async function(arduino) {
      listen(arduino);
    });
  } catch (e) {
    logger.warn('Unable to init device');
    logger.debug(e);
  }
}

module.exports = {
  init
};
