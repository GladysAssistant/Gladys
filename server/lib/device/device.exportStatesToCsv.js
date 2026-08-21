const Promise = require('bluebird');
const db = require('../../models');
const { NotFoundError, BadParameters } = require('../../utils/coreErrors');

const CSV_SEPARATOR = ',';
const CSV_HEADER = ['date', 'device', 'feature', 'unit', 'value'].join(CSV_SEPARATOR);

// A cell starting with one of these characters is interpreted as a formula by
// spreadsheets, so a device name or a string state could be executed when the
// file is opened. Such values are prefixed with an apostrophe, which makes the
// spreadsheet display them as plain text.
const CSV_FORMULA_PREFIXES = ['=', '+', '-', '@'];

/**
 * @description Escape a value so it can safely be written in a CSV cell.
 * @param {string|number|null} value - The value to escape.
 * @returns {string} The escaped value.
 * @example
 * escapeCsvValue('Living room, main');
 */
function escapeCsvValue(value) {
  if (value === null || value === undefined) {
    return '';
  }
  let stringValue = String(value);
  // Numbers are never formulas: only text values are neutralized, so a negative
  // temperature stays a number a spreadsheet can chart.
  if (
    typeof value === 'string' &&
    CSV_FORMULA_PREFIXES.includes(stringValue.charAt(0)) &&
    !Number.isFinite(Number(stringValue))
  ) {
    stringValue = `'${stringValue}`;
  }
  if (
    stringValue.includes(CSV_SEPARATOR) ||
    stringValue.includes('"') ||
    stringValue.includes('\n') ||
    stringValue.includes('\r')
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

/**
 * @description Export the history of one or several device features as a CSV file.
 * @param {Array<string>} deviceFeatureSelectors - Selectors of the device features to export.
 * @param {string|Date} startAt - Beginning of the exported period.
 * @param {string|Date} endAt - End of the exported period.
 * @param {object} options - Options.
 * @param {number} [options.maxSizeInBytes] - Refuse the export when the file is bigger than this.
 * @returns {Promise<string>} Resolve with the CSV content.
 * @example
 * const csv = await device.exportStatesToCsv(['my-feature'], '2025-01-01T00:00:00.000Z', '2025-02-01T00:00:00.000Z');
 */
async function exportStatesToCsv(deviceFeatureSelectors, startAt, endAt, { maxSizeInBytes } = {}) {
  if (!Array.isArray(deviceFeatureSelectors) || deviceFeatureSelectors.length === 0) {
    throw new BadParameters('device_features should be a non-empty list of device feature selectors');
  }
  // The same feature can be selected twice (a chart displaying it with two different
  // aggregations for example). Without this, its history would be counted once but
  // loaded and written as many times as it is selected.
  const uniqueSelectors = [...new Set(deviceFeatureSelectors)];
  const startDate = new Date(startAt);
  if (Number.isNaN(startDate.getTime())) {
    throw new BadParameters(`Invalid "start" date: ${startAt}`);
  }
  const endDate = new Date(endAt);
  if (Number.isNaN(endDate.getTime())) {
    throw new BadParameters(`Invalid "end" date: ${endAt}`);
  }
  if (endDate.getTime() < startDate.getTime()) {
    throw new BadParameters('The "end" date should be after the "start" date');
  }

  const deviceFeatures = uniqueSelectors.map((deviceFeatureSelector) => {
    const deviceFeature = this.stateManager.get('deviceFeature', deviceFeatureSelector);
    if (deviceFeature === null) {
      throw new NotFoundError('DeviceFeature not found');
    }
    return deviceFeature;
  });

  // The file is built in memory, so the export is refused upfront when the period
  // contains too many states: on a low-power machine, loading millions of states
  // would exhaust the memory. Counting first is cheap compared to reading them all.
  const featureIdPlaceholders = deviceFeatures.map(() => '?').join(',');
  const countRows = await db.duckDbReadConnectionAllAsync(
    `SELECT COUNT(*) AS count_states
     FROM t_device_feature_state
     WHERE device_feature_id IN (${featureIdPlaceholders})
     AND created_at >= CAST(? AS TIMESTAMPTZ)
     AND created_at <= CAST(? AS TIMESTAMPTZ)`,
    ...deviceFeatures.map((deviceFeature) => deviceFeature.id),
    startDate.toISOString(),
    endDate.toISOString(),
  );
  const numberOfStates = Number(countRows[0].count_states);
  if (numberOfStates > this.MAX_STATES_TO_EXPORT_IN_CSV) {
    throw new BadParameters(
      `This period contains ${numberOfStates} states, which is more than the ${this.MAX_STATES_TO_EXPORT_IN_CSV} states that can be exported at once. Please export a shorter period.`,
    );
  }

  const rows = [];

  // Features are exported one by one, reusing the existing raw history query,
  // then merged in one single date-ordered list so the file can directly be
  // read as a time series in a spreadsheet.
  await Promise.each(deviceFeatures, async (deviceFeature, index) => {
    const device = this.stateManager.get('deviceById', deviceFeature.device_id);
    const states = await this.getDeviceFeatureStates(uniqueSelectors[index], startDate, endDate);
    states.forEach((state) => {
      rows.push({
        createdAt: new Date(state.created_at),
        deviceName: device ? device.name : '',
        featureName: deviceFeature.name,
        unit: deviceFeature.unit,
        value: state.value,
      });
    });
  });

  rows.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  const lines = rows.map((row) =>
    [
      row.createdAt.toISOString(),
      escapeCsvValue(row.deviceName),
      escapeCsvValue(row.featureName),
      escapeCsvValue(row.unit),
      escapeCsvValue(row.value),
    ].join(CSV_SEPARATOR),
  );

  const csv = [CSV_HEADER, ...lines].join('\n');

  // Some transports cannot carry an arbitrarily large answer: the Gladys Plus
  // websocket in particular. Refusing here with the same message as the states
  // limit gives the user an actionable error instead of a failed download.
  const sizeInBytes = Buffer.byteLength(csv, 'utf8');
  if (maxSizeInBytes !== undefined && sizeInBytes > maxSizeInBytes) {
    throw new BadParameters(
      `This period exports ${sizeInBytes} bytes, which is more than the ${maxSizeInBytes} bytes that can be exported at once. Please export a shorter period.`,
    );
  }

  return csv;
}

module.exports = {
  exportStatesToCsv,
};
