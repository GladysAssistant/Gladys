import dayjs from 'dayjs';

import config from '../config';
import slugify from './slugify';

// Byte order mark, added at the beginning of the exported CSV file so
// spreadsheets (Excel in particular) open it as UTF-8 and display accented
// device names correctly.
const UTF8_BOM = '\ufeff';

// The file is downloaded in chunks of this many states, so an export of any
// size stays a series of small, fast calls: the server never builds more than
// one chunk, and the file is reassembled here.
const STATES_PER_CHUNK = 25000;
// Through Gladys Plus each chunk travels in one websocket message, which has to
// stay small.
const STATES_PER_CHUNK_THROUGH_GATEWAY = 1000;

/**
 * Download the history of the given device features as a CSV file. The history
 * is fetched chunk by chunk (cursor pagination) and reassembled here, so there
 * is no limit on the size of the exported period.
 *
 * @param {object} httpClient - The Gladys HTTP client.
 * @param {object} options - The export options.
 * @param {Array<string>} options.deviceFeatures - Selectors of the features to export.
 * @param {object|Date|string} options.startAt - Beginning of the exported period.
 * @param {object|Date|string} options.endAt - End of the exported period.
 * @param {string} options.filename - Name the file is built from, slugified.
 * @param {Function} [options.onProgress] - Called with the number of states downloaded so far.
 * @returns {Promise} Resolve when the download was handed to the browser.
 */
async function downloadDeviceFeaturesCsv(httpClient, { deviceFeatures, startAt, endAt, filename, onProgress }) {
  const startDate = dayjs(startAt);
  const endDate = dayjs(endAt);
  const baseQuery = {
    device_features: deviceFeatures.join(','),
    start: startDate.toISOString(),
    end: endDate.toISOString(),
    max_states: config.gatewayMode ? STATES_PER_CHUNK_THROUGH_GATEWAY : STATES_PER_CHUNK
  };

  // The parts are kept as an array and handed to the Blob as-is: the browser
  // never has to build the whole file as one single string.
  const parts = [UTF8_BOM];
  let statesCount = 0;
  let after = null;
  do {
    const query = after
      ? { ...baseQuery, after_created_at_us: after.createdAtUs, after_device_feature_id: after.deviceFeatureId }
      : baseQuery;
    // eslint-disable-next-line no-await-in-loop
    const chunk = await httpClient.get('/api/v1/device_feature/states_csv', query);
    if (chunk.csv && chunk.csv.length > 0) {
      parts.push(parts.length > 1 ? `\n${chunk.csv}` : chunk.csv);
    }
    statesCount += chunk.states || 0;
    if (onProgress) {
      onProgress(statesCount);
    }
    after = chunk.next;
  } while (after);

  const blob = new Blob(parts, { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const filenameSlug = slugify(filename || '') || 'history';
  link.download = `gladys-${filenameSlug}-${startDate.format('YYYY-MM-DD')}-${endDate.format('YYYY-MM-DD')}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export default downloadDeviceFeaturesCsv;
