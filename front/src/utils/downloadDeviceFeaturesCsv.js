import dayjs from 'dayjs';

import slugify from './slugify';

// Byte order mark, added at the beginning of the exported CSV file so
// spreadsheets (Excel in particular) open it as UTF-8 and display accented
// device names correctly.
const UTF8_BOM = '\uFEFF';

/**
 * Download the history of the given device features as a CSV file.
 * Shared by every place offering a CSV export (chart widget, device list), so
 * they all produce the same file and the same filename convention.
 *
 * @param {object} httpClient - The Gladys HTTP client.
 * @param {object} options - The export options.
 * @param {Array<string>} options.deviceFeatures - Selectors of the features to export.
 * @param {object|Date|string} options.startAt - Beginning of the exported period.
 * @param {object|Date|string} options.endAt - End of the exported period.
 * @param {string} options.filename - Name the file is built from, slugified.
 * @returns {Promise} Resolve when the download was handed to the browser.
 */
async function downloadDeviceFeaturesCsv(httpClient, { deviceFeatures, startAt, endAt, filename }) {
  const startDate = dayjs(startAt);
  const endDate = dayjs(endAt);
  const csv = await httpClient.get('/api/v1/device_feature/states_csv', {
    device_features: deviceFeatures.join(','),
    start: startDate.toISOString(),
    end: endDate.toISOString()
  });
  const blob = new Blob([`${UTF8_BOM}${csv}`], { type: 'text/csv;charset=utf-8;' });
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
