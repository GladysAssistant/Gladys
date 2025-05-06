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

  let name = `${zwaveNodeValue.id}${exposed.name !== '' ? `:${exposed.name}` : ''}`;

  if (propertyKey && propertyKeyName !== propertyKey && propertyKeyName && name.includes(propertyKey)) {
    name = name.replace(propertyKey, propertyKeyName);
  }

  return name;
}

module.exports = {
  getDeviceFeatureName,
};
