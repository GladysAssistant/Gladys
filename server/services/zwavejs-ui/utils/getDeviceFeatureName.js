/**
 * @description Compute a more userfriendly feature name if we can.
 * @param {object} exposed - An exposed feature found.
 * @param {object} zwaveNodeValue - The value received from zWave.
 * @example getDeviceFeatureName([{name: '', feature: {category: 'general-sensor', ..}}], {id: 41, ...})
 * @returns {string} - The feature name.
 */
function getDeviceFeatureName(exposed, zwaveNodeValue) {
  // Some devices expose as an ID a non userfriendly name (like a property key instead of a property key name).
  // We will try to replace it with the property key name if we can to make it more userfriendly in the UI.
  // For example: "6-50-1-65537" will be replaced by "6-50-1-Electric_kWh_Consumed"
  const { propertyKey, propertyKeyName } = zwaveNodeValue;

  let baseName = `${zwaveNodeValue.id}`;

  // The propertyKey is always the trailing segment of the id, so the replacement is
  // anchored there, before the exposed feature name (if any) gets appended. A plain
  // string replace would match the first occurrence instead, which can collide with
  // digits earlier in the id (e.g. propertyKey "1" wrongly matching the "1" in node
  // id "16").
  const propertyKeyStr = propertyKey !== null && propertyKey !== undefined ? String(propertyKey) : '';
  if (propertyKeyStr && propertyKeyName !== propertyKey && propertyKeyName && baseName.endsWith(propertyKeyStr)) {
    baseName = `${baseName.slice(0, baseName.length - propertyKeyStr.length)}${propertyKeyName}`;
  }

  return `${baseName}${exposed.name !== '' ? `:${exposed.name}` : ''}`;
}

module.exports = {
  getDeviceFeatureName,
};
