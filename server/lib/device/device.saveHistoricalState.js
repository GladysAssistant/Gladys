const Joi = require('joi');
const db = require('../../models');
const logger = require('../../utils/logger');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../utils/constants');
const { BadParameters } = require('../../utils/coreErrors');

// Date should be a valid ISO 8601 date format.
const dateSchema = Joi.date()
  .iso()
  .required();

/**
 * @description Save historical device feature state in DB.
 * @param {Object} deviceFeature - A DeviceFeature object.
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
    await db.DeviceFeatureState.create({
      device_feature_id: deviceFeature.id,
      value: newValue,
      created_at: newValueCreatedAtDate,
      updated_at: newValueCreatedAtDate,
    });
    // If the history is saved but value is not more recent
    if (!valueIsMoreRecentThanCurrentValue) {
      // We need to update last aggregate value
      // So that aggregate is calculated again
      const firstOfTheMonth = new Date(newValueCreatedAtDate.getFullYear(), newValueCreatedAtDate.getMonth(), 1);
      const dateAtMidnight = new Date(newValueCreatedAtDate);
      dateAtMidnight.setHours(0, 0, 0, 0);

      const newMonthlyAggregateIsBeforeCurrent =
        firstOfTheMonth < new Date(previousDeviceFeature.last_monthly_aggregate || 0);
      const newDailyAggregateIsBeforeCurrent =
        dateAtMidnight < new Date(previousDeviceFeature.last_daily_aggregate || 0);
      const newHourlyAggregateIsBeforeCurrent =
        dateAtMidnight < new Date(previousDeviceFeature.last_hourly_aggregate || 0);
      const toUpdate = {};
      if (newMonthlyAggregateIsBeforeCurrent) {
        toUpdate.last_monthly_aggregate = firstOfTheMonth;
      }
      if (newDailyAggregateIsBeforeCurrent) {
        toUpdate.last_daily_aggregate = dateAtMidnight;
      }
      if (newHourlyAggregateIsBeforeCurrent) {
        toUpdate.last_hourly_aggregate = dateAtMidnight;
      }
      if (Object.keys(toUpdate).length > 0) {
        // Update data in RAM
        this.stateManager.setState('deviceFeature', previousDeviceFeature.selector, toUpdate);
        // Update DB
        await db.DeviceFeature.update(toUpdate, {
          where: {
            id: deviceFeature.id,
          },
        });
      }
    }
  }
}

module.exports = {
  saveHistoricalState,
};
