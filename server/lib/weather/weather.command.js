const dayjs = require('dayjs');
const logger = require('../../utils/logger');
const { ServiceNotConfiguredError, NoValuesFoundError, NotFoundError } = require('../../utils/coreErrors');
const { INTENTS } = require('../../utils/constants');
const { NoWeatherFoundError } = require('./weather.error');

const DAYS_OF_WEEKS = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

/**
 * @description Get the weather by a day.
 * @param {Object} weather - The weather object return by the external service.
 * @param {string} day - The requested day.
 * @returns {Object} The weather object for the requested day.
 * @example
 * getWeatherByDay(weather, day);
 */
function getWeatherByDay(weather, day) {
  const filterWeatherDays = weather.days.filter((weatherDay) => {
    return dayjs(weatherDay.datetime).day() === DAYS_OF_WEEKS[day];
  });
  return filterWeatherDays.length === 1 ? filterWeatherDays[0] : undefined;
}

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
  let weatherDay;
  try {
    const houses = await this.house.get();
    const house = houses[0];
    if (!house || !house.latitude || !house.longitude) {
      throw new NoValuesFoundError();
    }
    weather = await this.get(house);
    switch (`intent.${classification.intent}`) {
      case INTENTS.WEATHER.GET:
        context.temperature = weather.temperature;
        context.units = weather.units === 'metric' ? '°C' : '°F';

        await this.messageManager.replyByIntent(message, `weather.get.success.${weather.weather}`, context);
        break;
      case INTENTS.WEATHER.TOMORROW:
        context.temperature_min = weather.days[0].temperature_min;
        context.temperature_max = weather.days[0].temperature_max;
        context.units = weather.units === 'metric' ? '°C' : '°F';
        await this.messageManager.replyByIntent(
          message,
          `weather.tomorrow.success.${weather.days[0].weather}`,
          context,
        );
        break;
      case INTENTS.WEATHER.AFTER_TOMORROW:
        context.temperature_min = weather.days[1].temperature_min;
        context.temperature_max = weather.days[1].temperature_max;
        context.units = weather.units === 'metric' ? '°C' : '°F';
        await this.messageManager.replyByIntent(
          message,
          `weather.after-tomorrow.success.${weather.days[1].weather}`,
          context,
        );
        break;
      case INTENTS.WEATHER.DAY:
        if (!context.day) {
          throw new NotFoundError('day not found');
        }
        weatherDay = getWeatherByDay(weather, context.day);
        if (!weatherDay) {
          throw new NoWeatherFoundError('weather for this day not found');
        }
        context.temperature_min = weatherDay.temperature_min;
        context.temperature_max = weatherDay.temperature_max;
        context.units = weather.units === 'metric' ? '°C' : '°F';
        await this.messageManager.replyByIntent(message, `weather.day.success.${weatherDay.weather}`, context);
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
    } else if (e instanceof NoWeatherFoundError) {
      await this.messageManager.replyByIntent(message, `weather.get.fail.no-weather`, context);
    } else {
      this.messageManager.replyByIntent(message, 'weather.get.fail', context);
    }
  }
}

module.exports = {
  command,
};
