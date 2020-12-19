const dayjs = require('dayjs');
const logger = require('../../utils/logger');
const { ServiceNotConfiguredError, NoValuesFoundError } = require('../../utils/coreErrors');
const { INTENTS } = require('../../utils/constants');
const { NoWeatherFoundError } = require('./weather.error');

/**
 * @description Capitalize First Letter.
 * @param {string} string - The word.
 * @returns {string} The capitalized first letter word.
 * @example
 * capitalizeFirstLetter('word');
 */
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * @description Get the weather in a text request.
 * @param {Object} message - The message sent by the user.
 * @param {Object} classification - The classification calculated by the brain.
 * @param {Object} context - The context object containing found variables in question.
 * @returns {Object} Nothing.
 * @example
 * weather.command(message, classification, context);
 */
async function command(message, classification, context) {
  try {
    const houses = await this.house.get();
    const house = houses[0];
    if (!house || !house.latitude || !house.longitude) {
      throw new NoValuesFoundError();
    }
    const weather = await this.get(house);

    if (`intent.${classification.intent}` === INTENTS.WEATHER.GET) {
      const dateEntity = classification.entities.find((entity) => entity.entity === 'date');
      // console.log(dateEntity);

      if (dateEntity === undefined) {
        // current day
        context.temperature = weather.temperature;
        context.units = weather.units === 'metric' ? '°C' : '°F';

        await this.messageManager.replyByIntent(message, `weather.get.success.now.${weather.weather}`, context);
      } else {
        let diff;
        if (dateEntity.resolution.type === 'interval') {
          diff = dayjs(dateEntity.resolution.strFutureValue).diff(dayjs().startOf('day'), 'day');
        } else {
          diff = dayjs(dateEntity.resolution.date).diff(dayjs().startOf('day'), 'day');
        }
        const weatherDay = weather.days[diff];

        if (weatherDay !== undefined) {
          context.temperature_min = weatherDay.temperature_min;
          context.temperature_max = weatherDay.temperature_max;
          context.units = weather.units === 'metric' ? '°C' : '°F';

          if (diff <= 2) {
            const days1 = ['today', 'tomorrow', 'after-tomorrow'];
            const day = days1[diff];

            await this.messageManager.replyByIntent(
              message,
              `weather.get.success.${day}.${weatherDay.weather}`,
              context,
            );
          } else {
            context.day = capitalizeFirstLetter(dateEntity.sourceText);
            await this.messageManager.replyByIntent(message, `weather.get.success.day.${weatherDay.weather}`, context);
          }
        } else {
          throw new NoWeatherFoundError('weather for this day not found');
        }
      }
    } else {
      throw new Error('Not found');
    }
  } catch (e) {
    logger.debug(e);
    if (e instanceof ServiceNotConfiguredError) {
      this.messageManager.replyByIntent(message, 'weather.get.fail.not-configured', context);
    } else if (e instanceof NoValuesFoundError) {
      this.messageManager.replyByIntent(message, 'weather.get.fail.no-house', context);
    } else if (e instanceof NoWeatherFoundError) {
      this.messageManager.replyByIntent(message, `weather.get.fail.no-weather`, context);
    } else {
      this.messageManager.replyByIntent(message, 'weather.get.fail', context);
    }
  }
}

module.exports = {
  command,
};
