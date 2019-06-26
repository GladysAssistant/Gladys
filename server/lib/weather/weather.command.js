const logger = require('../../utils/logger');
const { ServiceNotConfiguredError, NoValuesFoundError } = require('../../utils/coreErrors');

/**
 * @description Get the weather in a text request.
 * @param {Object} message - The message sent by the user.
 * @param {Object} classification - The classification calculated by the brain.
 * @param {Object} context - The context object containing found variables in question.
 * @example
 * weather.command(message, classification, context);
 */
async function command(message, classification, context) {
  let weather;
  try {
    const houses = await this.house.get();
    const house = houses[0];
    if (!house || !house.latitude || !house.longitude) {
      throw new NoValuesFoundError();
    }
    switch (classification.intent) {
      case 'weather.get':
        weather = await this.get(house);
        context.temperature = weather.temperature;
        context.units = weather.units === 'si' ? '°C' : '°F';
        await this.messageManager.replyByIntent(message, `weather.get.success.${weather.weather}`, context);
        break;
      default:
        throw new Error('Not found');
    }
  } catch (e) {
    logger.debug(e);
    if (e instanceof ServiceNotConfiguredError) {
      this.messageManager.replyByIntent(message, 'weather.get.fail.not-configured', context);
    } else if (e instanceof NoValuesFoundError) {
      this.messageManager.replyByIntent(message, 'weather.get.fail.no-house', context);
    } else {
      this.messageManager.replyByIntent(message, 'weather.get.fail', context);
    }
  }
}

module.exports = {
  command,
};
