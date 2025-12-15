const Promise = require('bluebird');
const dayjs = require('dayjs');
const db = require('../../../models');

const { NotFoundError, BadParameters } = require('../../../utils/coreErrors');
const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
  ENERGY_PRICE_TYPES,
} = require('../../../utils/constants');

const GROUPED_QUERY_DATE_RANGE = `
  SELECT
    DATE_TRUNC(?, created_at) AS grouped_date,
    AVG(value) AS value,
    MAX(value) AS max_value,
    MIN(value) AS min_value,
    SUM(value) AS sum_value,
    COUNT(value) AS count_value
  FROM
    t_device_feature_state
  WHERE
    device_feature_id = ?
    AND created_at >= ?
    AND created_at < ?
  GROUP BY
    grouped_date
  ORDER BY
    grouped_date;
`;

/**
 * @description Calculate subscription prices for each time period.
 * @param {Array} subscriptionPrices - Array of subscription price entries from DB.
 * @param {Date} fromDate - Start date of the range.
 * @param {Date} toDate - End date of the range.
 * @param {string} groupBy - Grouping period ('hour', 'day', 'month', 'year').
 * @returns {Array} Array of subscription values per period.
 * @example
 * calculateSubscriptionPrices(prices, new Date('2023-01-01'), new Date('2023-01-31'), 'day');
 */
function calculateSubscriptionPrices(subscriptionPrices, fromDate, toDate, groupBy) {
  const subscriptionValues = [];
  let currentDate = dayjs(fromDate);
  const endDate = dayjs(toDate);

  while (currentDate.isBefore(endDate)) {
    let nextDate;
    let periodLabel;

    switch (groupBy) {
      case 'hour':
        nextDate = currentDate.add(1, 'hour');
        periodLabel = currentDate.toISOString();
        break;
      case 'day':
        nextDate = currentDate.add(1, 'day');
        periodLabel = currentDate.toISOString();
        break;
      case 'week':
        nextDate = currentDate.add(1, 'week');
        periodLabel = currentDate.toISOString();
        break;
      case 'month':
        nextDate = currentDate.add(1, 'month');
        periodLabel = currentDate.toISOString();
        break;
      case 'year':
        nextDate = currentDate.add(1, 'year');
        periodLabel = currentDate.toISOString();
        break;
      default:
        nextDate = currentDate.add(1, 'day');
        periodLabel = currentDate.toISOString();
    }

    // Find the subscription price valid for this period
    const currentDateStr = currentDate.format('YYYY-MM-DD');
    const validPrice = subscriptionPrices.find((price) => {
      const startDate = price.start_date;
      const endDatePrice = price.end_date;
      return startDate <= currentDateStr && (endDatePrice === null || endDatePrice >= currentDateStr);
    });

    if (validPrice) {
      // Price is stored as integer, divide by 10000 to get float
      // The price is monthly, so we need to calculate the price for the period
      const monthlyPrice = validPrice.price / 10000;

      let periodPrice;
      switch (groupBy) {
        case 'hour': {
          // Divide monthly price by days in month, then by 24 hours
          const daysInMonth = currentDate.daysInMonth();
          periodPrice = monthlyPrice / daysInMonth / 24;
          break;
        }
        case 'day': {
          // Divide monthly price by days in month
          const daysInMonth = currentDate.daysInMonth();
          periodPrice = monthlyPrice / daysInMonth;
          break;
        }
        case 'week': {
          // Approximate: divide monthly price by ~4.33 weeks per month
          const daysInMonth = currentDate.daysInMonth();
          periodPrice = (monthlyPrice / daysInMonth) * 7;
          break;
        }
        case 'month':
          periodPrice = monthlyPrice;
          break;
        case 'year':
          periodPrice = monthlyPrice * 12;
          break;
        default:
          periodPrice = monthlyPrice / currentDate.daysInMonth();
      }

      subscriptionValues.push({
        created_at: periodLabel,
        value: periodPrice,
        sum_value: periodPrice,
        contract_name: validPrice.contract_name,
      });
    }

    currentDate = nextDate;
  }

  return subscriptionValues;
}

/**
 * @description Get electricity consumption by date.
 * @param {Array<string>} selectors - Device selector.
 * @param {object} options - Options object.
 * @param {Date} [options.from] - Start date for date range approach.
 * @param {Date} [options.to] - End date for date range approach.
 * @param {string} [options.group_by] - Group results by time period ('hour', 'day', 'week', 'month', 'year').
 * @param {string} [options.display_mode] - Display mode: 'currency' (default) or 'kwh'.
 * @returns {Promise<object>} - Resolve with an object containing consumption and subscription data.
 * @example
 * device.getConsumptionByDates(['test-device'], {
 *   from: new Date('2023-01-01'),
 *   to: new Date('2023-01-31'),
 *   group_by: 'day'
 * });
 */
async function getConsumptionByDates(selectors, options = {}) {
  const { display_mode: displayMode = 'currency' } = options;

  const consumptionResults = await Promise.map(
    selectors,
    async (selector) => {
      let deviceFeature = this.stateManager.get('deviceFeature', selector);
      if (deviceFeature === null) {
        throw new NotFoundError('DeviceFeature not found');
      }

      // Store the original cost feature's currency unit before potentially swapping
      const originalCostFeature = deviceFeature;
      const currencyUnit =
        originalCostFeature.category === DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR &&
        originalCostFeature.type === DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION_COST
          ? originalCostFeature.unit
          : null;

      // If display_mode is 'kwh' and this is a cost feature, hot-replace with the consumption feature
      // The cost feature has energy_parent_id pointing to the consumption feature
      if (
        displayMode === 'kwh' &&
        deviceFeature.category === DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR &&
        deviceFeature.type === DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION_COST &&
        deviceFeature.energy_parent_id
      ) {
        const consumptionFeature = this.stateManager.get('deviceFeatureById', deviceFeature.energy_parent_id);
        if (consumptionFeature) {
          deviceFeature = consumptionFeature;
        }
      }

      const device = this.stateManager.get('deviceById', deviceFeature.device_id);

      // Extract options with defaults
      const { from, to, group_by: groupBy = null } = options;

      const fromDate = new Date(from);
      const toDate = new Date(to);

      if (fromDate >= toDate) {
        throw new BadParameters('"from" date must be before "to" date');
      }

      // Offset in UTC
      fromDate.setMinutes(fromDate.getMinutes() - fromDate.getTimezoneOffset());
      toDate.setMinutes(toDate.getMinutes() - toDate.getTimezoneOffset());

      let values;

      // Validate groupBy parameter if provided
      const validGroupByOptions = ['hour', 'day', 'week', 'month', 'year'];

      if (groupBy !== null && !validGroupByOptions.includes(groupBy)) {
        throw new BadParameters(`Invalid groupBy parameter. Must be one of: ${validGroupByOptions.join(', ')}`);
      }

      values = await db.duckDbReadConnectionAllAsync(
        GROUPED_QUERY_DATE_RANGE,
        groupBy,
        deviceFeature.id,
        fromDate,
        toDate,
      );

      // Check if we need to convert from Wh to kWh (when display_mode is 'kwh' and unit is WATT_HOUR)
      const needsWhToKwhConversion = displayMode === 'kwh' && deviceFeature.unit === DEVICE_FEATURE_UNITS.WATT_HOUR;

      // Rename grouped_date to created_at for consistency with the existing API
      // and convert Wh to kWh if needed
      values = values.map((value) => {
        const conversionFactor = needsWhToKwhConversion ? 1 / 1000 : 1;
        const newValue = {
          ...value,
          created_at: value.grouped_date,
          count_value: Number(value.count_value),
          value: value.value * conversionFactor,
          max_value: value.max_value * conversionFactor,
          min_value: value.min_value * conversionFactor,
          sum_value: value.sum_value * conversionFactor,
        };
        delete newValue.grouped_date;
        return newValue;
      });

      return {
        device: {
          name: device.name,
        },
        deviceFeature: {
          name: deviceFeature.name,
          currency_unit: currencyUnit,
        },
        values,
      };
    },
    { concurrency: 4 },
  );

  // Add subscription prices if in currency mode
  if (selectors.length > 0 && displayMode === 'currency') {
    const firstSelector = selectors[0];
    const firstFeature = this.stateManager.get('deviceFeature', firstSelector);

    if (firstFeature) {
      // Get the root electric meter device
      const rootFeature = this.getRootElectricMeterDevice(firstFeature);
      const electricMeterDeviceId = rootFeature ? rootFeature.device_id : firstFeature.device_id;

      // Fetch subscription prices for this electric meter device
      const allPrices = await db.EnergyPrice.findAll({
        where: {
          electric_meter_device_id: electricMeterDeviceId,
          price_type: ENERGY_PRICE_TYPES.SUBSCRIPTION,
        },
        order: [['start_date', 'ASC']],
      });

      const subscriptionPrices = allPrices.map((r) => r.get({ plain: true }));

      if (subscriptionPrices.length > 0) {
        const { from, to, group_by: groupBy = 'day' } = options;
        const fromDate = new Date(from);
        const toDate = new Date(to);
        let subscriptionValues = calculateSubscriptionPrices(subscriptionPrices, fromDate, toDate, groupBy);

        // Filter subscription values to only include dates within the range of actual consumption data
        // This prevents showing subscription prices for future dates or dates without data
        if (consumptionResults.length > 0 && consumptionResults[0].values.length > 0) {
          const consumptionValues = consumptionResults[0].values;
          const firstConsumptionDate = new Date(consumptionValues[0].created_at);
          const lastConsumptionDate = new Date(consumptionValues[consumptionValues.length - 1].created_at);

          subscriptionValues = subscriptionValues.filter((sv) => {
            const subscriptionDate = new Date(sv.created_at);
            return subscriptionDate >= firstConsumptionDate && subscriptionDate <= lastConsumptionDate;
          });
        } else {
          // No consumption data - don't show any subscription prices
          subscriptionValues = [];
        }

        if (subscriptionValues.length > 0) {
          const device = this.stateManager.get('deviceById', firstFeature.device_id);

          // Get the contract name from the first subscription value
          const contractName = subscriptionValues[0].contract_name || firstFeature.name;

          consumptionResults.unshift({
            device: {
              name: device.name,
            },
            deviceFeature: {
              name: contractName,
              currency_unit: firstFeature.unit,
              is_subscription: true,
            },
            values: subscriptionValues,
          });
        }
      }
    }
  }

  return consumptionResults;
}

module.exports = {
  getConsumptionByDates,
};
