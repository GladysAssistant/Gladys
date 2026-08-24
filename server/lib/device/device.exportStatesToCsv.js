const db = require('../../models');
const { NotFoundError, BadParameters } = require('../../utils/coreErrors');

const CSV_SEPARATOR = ',';
const CSV_HEADER = ['date', 'device', 'feature', 'unit', 'value'].join(CSV_SEPARATOR);

// A cell starting with one of these characters is interpreted as a formula by
// spreadsheets, so a device name or a string state could be executed when the
// file is opened. Such values are prefixed with an apostrophe, which makes the
// spreadsheet display them as plain text.
const CSV_FORMULA_PREFIXES = ['=', '+', '-', '@'];

// The states are read ordered by (created_at, device_feature_id): the file stays
// one single date-ordered time series, and the pair is a cursor a chunk can
// restart from. created_at is compared in microseconds (epoch_us) because the
// database stores more precision than a JavaScript date carries: a cursor
// rounded to the millisecond could skip or duplicate states at a chunk boundary.
const EXPORT_STATES_QUERY = `
  SELECT
      device_feature_id,
      value,
      created_at,
      epoch_us(created_at) AS created_at_us
  FROM t_device_feature_state
  WHERE device_feature_id IN (%FEATURE_PLACEHOLDERS%)
  AND created_at >= CAST(? AS TIMESTAMPTZ)
  AND created_at <= CAST(? AS TIMESTAMPTZ)
  %AFTER_CLAUSE%
  ORDER BY created_at ASC, device_feature_id ASC
`;

const AFTER_CLAUSE = `AND (
  epoch_us(created_at) > CAST(? AS BIGINT)
  OR (epoch_us(created_at) = CAST(? AS BIGINT) AND device_feature_id > CAST(? AS UUID))
)`;

// Fetch every row of one exact (created_at, device_feature_id) pair. Only used in
// the pathological case where one single pair holds more rows than a whole chunk:
// such a group cannot be split over two chunks without duplicating or losing rows,
// so it is exported in one piece instead.
const TIE_GROUP_QUERY = `
  SELECT
      device_feature_id,
      value,
      created_at,
      epoch_us(created_at) AS created_at_us
  FROM t_device_feature_state
  WHERE device_feature_id IN (%FEATURE_PLACEHOLDERS%)
  AND epoch_us(created_at) = CAST(? AS BIGINT)
  AND device_feature_id = CAST(? AS UUID)
`;

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
 * @description The cursor key of a state row, as strings so it can travel in a JSON response.
 * @param {object} row - A state row of the export query.
 * @returns {object} The cursor pointing at this row.
 * @example
 * cursorOf({ created_at_us: 1756393200000000n, device_feature_id: 'ca91dfdf-...' });
 */
function cursorOf(row) {
  return {
    createdAtUs: String(row.created_at_us),
    deviceFeatureId: String(row.device_feature_id),
  };
}

/**
 * @description Export one chunk of the history of one or several device features as CSV.
 *
 * The export is cursor-paginated so a period of any size can be exported without
 * ever holding more than one chunk in memory: the caller (HTTP route, or the
 * client reassembling the file) keeps requesting the next chunk with the returned
 * cursor until `next` is null. The header line is only part of the first chunk,
 * so the chunks concatenate into one valid file.
 * @param {Array<string>} deviceFeatureSelectors - Selectors of the device features to export.
 * @param {string|Date} startAt - Beginning of the exported period.
 * @param {string|Date} endAt - End of the exported period.
 * @param {object} [options] - Options.
 * @param {number} [options.maxStates] - Maximum states in this chunk, capped by MAX_STATES_PER_CSV_EXPORT_CHUNK.
 * @param {object} [options.after] - Cursor returned by the previous chunk ({ createdAtUs, deviceFeatureId }).
 * @returns {Promise<object>} Resolve with { csv, next, states }.
 * @example
 * const { csv, next } = await device.exportStatesToCsv(['my-feature'], '2025-01-01', '2025-02-01');
 */
async function exportStatesToCsv(deviceFeatureSelectors, startAt, endAt, { maxStates, after } = {}) {
  if (!Array.isArray(deviceFeatureSelectors) || deviceFeatureSelectors.length === 0) {
    throw new BadParameters('device_features should be a non-empty list of device feature selectors');
  }
  // The same feature can be selected twice; its history must be loaded and
  // written only once.
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
  if (after !== undefined && (!/^\d+$/.test(String(after.createdAtUs)) || !after.deviceFeatureId)) {
    throw new BadParameters('Invalid "after" cursor');
  }

  const deviceFeatures = uniqueSelectors.map((deviceFeatureSelector) => {
    const deviceFeature = this.stateManager.get('deviceFeature', deviceFeatureSelector);
    if (deviceFeature === null) {
      throw new NotFoundError('DeviceFeature not found');
    }
    return deviceFeature;
  });
  const featuresById = new Map(deviceFeatures.map((deviceFeature) => [deviceFeature.id, deviceFeature]));

  // The chunk size stays bounded whatever the caller asks: the chunk is what
  // keeps the memory of the server (and of a gateway payload) small.
  const requestedMaxStates = Number.isFinite(maxStates) ? Math.floor(maxStates) : this.MAX_STATES_PER_CSV_EXPORT_CHUNK;
  const limit = Math.min(Math.max(requestedMaxStates, 1), this.MAX_STATES_PER_CSV_EXPORT_CHUNK);

  const featureIdPlaceholders = deviceFeatures.map(() => '?').join(',');
  const featureIdParams = deviceFeatures.map((deviceFeature) => deviceFeature.id);
  const query = `${EXPORT_STATES_QUERY.replace('%FEATURE_PLACEHOLDERS%', featureIdPlaceholders).replace(
    '%AFTER_CLAUSE%',
    after !== undefined ? AFTER_CLAUSE : '',
  )} LIMIT ${limit + 1}`;
  const afterParams =
    after !== undefined ? [String(after.createdAtUs), String(after.createdAtUs), after.deviceFeatureId] : [];
  // One row more than the chunk: the extra row tells whether the export is complete
  // without a second counting query.
  const rows = await db.duckDbReadConnectionAllAsync(
    query,
    ...featureIdParams,
    startDate.toISOString(),
    endDate.toISOString(),
    ...afterParams,
  );

  let chunkRows = rows;
  let next = null;
  if (rows.length > limit) {
    // The cursor is the (created_at, device_feature_id) pair, so a group of rows
    // sharing the same pair cannot be split across two chunks: the rows of the
    // boundary pair are pushed back to the next chunk instead.
    const boundaryKey = JSON.stringify(cursorOf(rows[limit]));
    chunkRows = rows.slice(0, limit).filter((row) => JSON.stringify(cursorOf(row)) !== boundaryKey);
    if (chunkRows.length > 0) {
      next = cursorOf(chunkRows[chunkRows.length - 1]);
    } else {
      // Pathological case: one single pair holds more rows than a whole chunk.
      // Export the whole group in one (bounded) piece and move the cursor past it.
      const boundary = cursorOf(rows[limit]);
      chunkRows = await db.duckDbReadConnectionAllAsync(
        TIE_GROUP_QUERY.replace('%FEATURE_PLACEHOLDERS%', featureIdPlaceholders),
        ...featureIdParams,
        boundary.createdAtUs,
        boundary.deviceFeatureId,
      );
      next = boundary;
    }
  }

  const lines = chunkRows.map((row) => {
    const deviceFeature = featuresById.get(String(row.device_feature_id));
    const device = deviceFeature ? this.stateManager.get('deviceById', deviceFeature.device_id) : null;
    return [
      new Date(row.created_at).toISOString(),
      escapeCsvValue(device ? device.name : ''),
      escapeCsvValue(deviceFeature ? deviceFeature.name : ''),
      escapeCsvValue(deviceFeature ? deviceFeature.unit : null),
      escapeCsvValue(row.value),
    ].join(CSV_SEPARATOR);
  });

  // The header only belongs to the first chunk, so the chunks concatenate
  // (separated by a line break) into one valid CSV file.
  if (after === undefined) {
    lines.unshift(CSV_HEADER);
  }

  return {
    csv: lines.join('\n'),
    next,
    states: chunkRows.length,
  };
}

module.exports = {
  exportStatesToCsv,
};
