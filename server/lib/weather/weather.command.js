const moment = require('moment');
const logger = require('../../utils/logger');
const { ServiceNotConfiguredError, NoValuesFoundError } = require('../../utils/coreErrors');

const DAYS_IN_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const parseTime = (time) => {
  let hour = 0;
  let minute = 0;
  if (time.search('AM') !== -1) {
    hour = Number(time.substring(0, time.length - 2));
  } else if (time.search('PM') !== -1) {
    hour = Number(time.substring(0, time.length - 2)) + 12;
  } else if (time.search(':') !== -1) {
    [hour, minute] = time.split(':');
  }
  return { hour, minute };
};

const parseWeek = (day, contextDate) => {
  let i = 1;
  let dayActual = 0;
  let dayTarget = 0;
  DAYS_IN_WEEK.forEach((dayInWeek) => {
    if (day.format('dddd').toLowerCase() === dayInWeek) {
      dayActual = i;
    }
    if (contextDate === dayInWeek) {
      dayTarget = i;
    }
    i += 1;
  });
  if (dayActual === dayTarget) {
    day.add(7, 'days');
  } else if (dayTarget > dayActual) {
    day.add(dayTarget - dayActual, 'days');
  } else {
    day.add(7 - dayActual + dayTarget, 'days');
  }
};

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
    const day = moment().subtract(
      moment()
        .toDate()
        .getTimezoneOffset(),
      'minutes',
    );
    let hour = 0;
    let minute = 0;
    switch (classification.intent) {
      case 'weather.get':
        weather = await this.get(house);
        context.temperature = weather.temperature;
        context.units = weather.units === 'si' ? '°C' : '°F';
        await this.messageManager.replyByIntent(message, `weather.get.success.${weather.weather}`, context);
        break;
      case 'weather.getPrevisions':
        if (context.time) {
          house.target = 'hourly';
          const { hour: Thour, minute: Tminute } = parseTime(context.time);
          hour = Thour;
          minute = Tminute;
          if (hour < day.hour()) {
            day.add(1, 'days');
          }
        } else if (context.date) {
          house.target = 'daily';
          const date = context.date.split(' ');
          if (date[0] === 'in') {
            if (date[2] === 'days') {
              day.add(date[1], 'days');
            }
          } else {
            if (DAYS_IN_WEEK.includes(context.date)) {
              parseWeek(day, context.date);
            }
            if (context.date.toLowerCase() === 'tomorrow') {
              day.add(1, 'days');
            }
          }
        } else if (context.datetime) {
          const datetime = context.datetime.split(' ');
          if (datetime[0] === 'in') {
            const dayToCompare = day.clone();
            if (datetime[2] === 'minutes') {
              house.target = 'hourly';
              [, minute] = datetime;
              if (day.date() !== dayToCompare.add(datetime[1], 'minutes').date()) {
                day.add(datetime[1], 'minutes');
                hour = day.hour();
                minute = day.minute();
              }
            }
            if (datetime[2] === 'hours') {
              house.target = 'hourly';
              [, hour] = datetime;
              if (day.date() !== dayToCompare.add(datetime[1], 'hours').date()) {
                day.add(datetime[1], 'hours');
                hour = day.hour();
                minute = day.minute();
              } else {
                hour = dayToCompare.hour();
                minute = dayToCompare.minute();
              }
            }
          } else if (datetime[1] === 'at') {
            house.target = 'hourly';
            parseWeek(day, datetime[0]);
            const { hour: Thour, minute: Tminute } = parseTime(datetime[2]);
            hour = Thour;
            minute = Tminute;
          }
        }
        day.startOf('day');
        day.set('hours', hour);
        day.set('minutes', minute);
        house.datetime = day
          .clone()
          .add(
            moment()
              .toDate()
              .getTimezoneOffset(),
            'minutes',
          )
          .unix();
        weather = await this.get(house);
        context.previsionDate = day.format('dddd DD');
        context.previsionTime = `${day.format('HH')}h${day.format('mm')}`;
        context.summary = weather.summary;
        context.units = weather.units === 'si' ? '°C' : '°F';
        if (weather.temperatureMin && weather.temperatureMax) {
          context.temperatureMin = weather.temperatureMin;
          context.temperatureMax = weather.temperatureMax;
          await this.messageManager.replyByIntent(message, `weather.getPrevisions.success.daily`, context);
        } else {
          context.temperature = weather.temperature;
          await this.messageManager.replyByIntent(message, `weather.getPrevisions.success`, context);
        }
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
