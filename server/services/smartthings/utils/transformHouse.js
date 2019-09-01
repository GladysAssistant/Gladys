const { DEVICE_FEATURE_UNITS } = require('../../../utils/constants');
/**
 * @description Transform a Gladys house into a SmartThings location.
 * @param {Object} house - The Gladys location.
 * @param {Object} user - The Gladys user.
 * @returns {Object} Transformed to SmartThings location.
 * @example
 * transformHouse({
 *   id: 'a741dfa6-24de-4b46-afc7-370772f068d5',
 *   name: 'Test house',
 *   latitude: 12,
 *   longitude: 12,
 *   selector: 'test-house',
 *   created_at: '2019-02-12 07:49:07.556 +00:00',
 *   updated_at: '2019-02-12 07:49:07.556 +00:00',
 * })
 */
function transformHouse(house, user) {
  return {
    name: house.name,
    countryCode: 'FRA',
    latitude: house.latitude,
    longitude: house.longitude,
    temperatureScale: user.temperature_unit_preference === DEVICE_FEATURE_UNITS.FAHRENHEIT ? 'F' : 'C',
    locale: user.language,
    additionalProperties: { gladysHouseId: house.id },
  };
}

module.exports = {
  transformHouse,
};
