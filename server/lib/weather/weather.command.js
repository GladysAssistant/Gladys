const dayjs = require('dayjs');
const logger = require('../../utils/logger');
const { ServiceNotConfiguredError, NoValuesFoundError } = require('../../utils/coreErrors');
const { INTENTS } = require('../../utils/constants');
const { NoWeatherFoundError } = require('./weather.error');
const { NotFoundError } = require('../../utils/coreErrors');

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
 * @param {object} message - The message sent by the user.
 * @param {object} classification - The classification calculated by the brain.
 * @param {object} context - The context object containing found variables in question.
 * @returns {object} Nothing.
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
    const options = {
      latitude: house.latitude,
      longitude: house.longitude,
      units: message.user.distance_unit_preference,
      language: message.user.language,
    };
    const weather = await this.get(options);

    if (`intent.${classification.intent}` === INTENTS.WEATHER.GET) {
      const dateEntity = classification.entities.find((entity) => entity.entity === 'date');

      if (dateEntity === undefined) {
        // current day
        context.temperature = weather.temperature;
        context.units = weather.units === 'metric' ? '°C' : '°F';

        await this.messageManager.replyByIntent(message, `weather.get.success.now.${weather.weather}`, context);
      } else {
        let diffDate;
        if (dateEntity.resolution.type === 'interval') {
          diffDate = dateEntity.resolution.strFutureValue;
        } else {
          diffDate = dateEntity.resolution.date;
        }
        const diff = dayjs(diffDate).diff(dayjs().startOf('day'), 'day');

        // resolve the day by calendar date, never by index: the pivot
        // weather format (B.18) does not guarantee that days[0] is today
        const weatherDay = (weather.days || []).find((day) => dayjs(day.datetime).isSame(dayjs(diffDate), 'day'));

        if (weatherDay !== undefined && diff >= 0) {
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
      throw new NotFoundError('Not found');
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
