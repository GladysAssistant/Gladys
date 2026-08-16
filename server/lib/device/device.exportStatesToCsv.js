const Promise = require('bluebird');
const db = require('../../models');
const { NotFoundError, BadParameters } = require('../../utils/coreErrors');

const CSV_SEPARATOR = ',';
const CSV_HEADER = ['date', 'device', 'feature', 'unit', 'value'].join(CSV_SEPARATOR);

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
  const stringValue = String(value);
  if (stringValue.includes(CSV_SEPARATOR) || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

/**
 * @description Export the history of one or several device features as a CSV file.
 * @param {Array<string>} deviceFeatureSelectors - Selectors of the device features to export.
 * @param {string|Date} startAt - Beginning of the exported period.
 * @param {string|Date} endAt - End of the exported period.
 * @returns {Promise<string>} Resolve with the CSV content.
 * @example
 * const csv = await device.exportStatesToCsv(['my-feature'], '2025-01-01T00:00:00.000Z', '2025-02-01T00:00:00.000Z');
 */
async function exportStatesToCsv(deviceFeatureSelectors, startAt, endAt) {
  if (!Array.isArray(deviceFeatureSelectors) || deviceFeatureSelectors.length === 0) {
    throw new BadParameters('device_features should be a non-empty list of device feature selectors');
  }
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

  const deviceFeatures = deviceFeatureSelectors.map((deviceFeatureSelector) => {
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
    const states = await this.getDeviceFeatureStates(deviceFeatureSelectors[index], startDate, endDate);
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

  return [CSV_HEADER, ...lines].join('\n');
}

module.exports = {
  exportStatesToCsv,
};
