const Joi = require('joi');
const { Op } = require('sequelize');
const db = require('../../models');
const logger = require('../../utils/logger');
const { formatDateInUTC } = require('../../utils/date');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../utils/constants');
const { BadParameters } = require('../../utils/coreErrors');

// Date should be a valid ISO 8601 date format.
const dateSchema = Joi.date()
  .iso()
  .required();

/**
 * @description Save historical device feature state in DB.
 * @param {object} deviceFeature - A DeviceFeature object.
 * @param {number} newValue - The new value of the deviceFeature to save.
 * @param {string} newValueCreatedAt - The date of the new state.
 * @example
 * saveHistoricalState({
 *   id: 'fc235c88-b10d-4706-8b59-fef92a7119b2',
 *   selector: 'my-light'
 * }, 12, '2011-10-05T14:48:00.000Z');
 */
async function saveHistoricalState(deviceFeature, newValue, newValueCreatedAt) {
  // Validate that the number is correct
  if (Number.isNaN(newValue)) {
    throw new BadParameters(`device.saveHistoricalState of NaN value on ${deviceFeature.selector}`);
  }
  // Validate that the date is correct
  const result = dateSchema.validate(newValueCreatedAt);
  if (result.error) {
    throw new BadParameters(result.error.details[0].message);
  }

  logger.debug(`device.saveHistoricalState of deviceFeature ${deviceFeature.selector}`);

  const previousDeviceFeature = this.stateManager.get('deviceFeature', deviceFeature.selector);
  const previousDeviceFeatureLastValueChanged =
    previousDeviceFeature && previousDeviceFeature.last_value_changed
      ? new Date(previousDeviceFeature.last_value_changed) // if date exists
      : new Date(0); // 1st of January 1970

  const newValueCreatedAtDate = new Date(newValueCreatedAt);

  // We only save new state if the current state in cache is less recent than the new value
  const valueIsMoreRecentThanCurrentValue = newValueCreatedAtDate > previousDeviceFeatureLastValueChanged;

  if (valueIsMoreRecentThanCurrentValue) {
    // save local state in RAM
    this.stateManager.setState('deviceFeature', deviceFeature.selector, {
      last_value: newValue,
      last_value_changed: newValueCreatedAtDate,
    });
    // update deviceFeature lastValue in DB
    await db.DeviceFeature.update(
      {
        last_value: newValue,
        last_value_changed: newValueCreatedAtDate,
      },
      {
        where: {
          id: deviceFeature.id,
        },
      },
    );

    // send websocket event
    this.eventManager.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.DEVICE.NEW_STATE,
      payload: {
        device_feature_selector: deviceFeature.selector,
        last_value: newValue,
        last_value_changed: newValueCreatedAtDate,
      },
    });
  }
  // if the deviceFeature should keep history, we save a new deviceFeatureState
  if (deviceFeature.keep_history) {
    const valueAlreadyExistInDb = await db.duckDbReadConnectionAllAsync(
      `
        SELECT * 
        FROM t_device_feature_state
        WHERE device_feature_id = ?
        AND value = ?
        AND created_at = ?
      `,
      deviceFeature.id,
      newValue,
      formatDateInUTC(newValueCreatedAtDate),
    );
    // if the value already exist in the DB, don't re-create it
    if (valueAlreadyExistInDb.length > 0) {
      logger.debug('device.saveHistoricalState: Not saving value in history, value already exists');
      return;
    }
    await db.duckDbInsertState(deviceFeature.id, newValue, newValueCreatedAtDate);
    // We need to update last aggregate value
    // So that aggregate is calculated again
    const lastDayOfPreviousMonth = new Date(
      newValueCreatedAtDate.getFullYear(),
      newValueCreatedAtDate.getMonth() - 1,
      0,
    );
    const dayBeforeJustBeforeMidnight = new Date(
      newValueCreatedAtDate.getFullYear(),
      newValueCreatedAtDate.getMonth(),
      newValueCreatedAtDate.getDate() - 1,
      23,
      59,
      59,
    );

    // We update last monthly aggregate only if current last monthly aggregate is more recent
    await db.DeviceFeature.update(
      {
        last_monthly_aggregate: lastDayOfPreviousMonth,
      },
      {
        where: {
          id: deviceFeature.id,
          last_monthly_aggregate: {
            [Op.gt]: lastDayOfPreviousMonth,
          },
        },
      },
    );

    // We update last daily aggregate only if current last daily aggregate is more recent
    await db.DeviceFeature.update(
      {
        last_daily_aggregate: dayBeforeJustBeforeMidnight,
      },
      {
        where: {
          id: deviceFeature.id,
          last_daily_aggregate: {
            [Op.gt]: dayBeforeJustBeforeMidnight,
          },
        },
      },
    );

    // We update last hourly aggregate only if current last hourly aggregate is more recent
    await db.DeviceFeature.update(
      {
        last_hourly_aggregate: dayBeforeJustBeforeMidnight,
      },
      {
        where: {
          id: deviceFeature.id,
          last_hourly_aggregate: {
            [Op.gt]: dayBeforeJustBeforeMidnight,
          },
        },
      },
    );

    const newDeviceInDb = await db.DeviceFeature.findOne({
      where: {
        id: deviceFeature.id,
      },
      raw: true,
    });

    this.stateManager.setState('deviceFeature', deviceFeature.selector, newDeviceInDb);
  }
}

module.exports = {
  saveHistoricalState,
};
