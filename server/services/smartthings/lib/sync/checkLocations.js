const locationAPI = require('../api/location');
const { transformHouse } = require('../../utils/transformHouse');

/**
 * @description Checks if Gladys house exists in SmartThings, if not create it.
 * @param {Object} user - The current Gladys user.
 * @returns {Object[]} All locations matching Gladys houses.
 * @example
 * smartthings.checkLocations(gladysUser)
 */
async function checkLocations(user) {
  // Get current user SMT location
  const smtLocations = await locationAPI.list(this.getToken(user));

  // Get current user Gladys house
  const gladysHouses = this.gladys.location.get(user);
  const gladysLocationIds = gladysHouses.map((house) => house.id);

  // Check for locations to create
  const smtValidLocations = [];
  smtLocations.forEach((location) => {
    if (location.additionalProperties && location.additionalProperties.gladysHouseId) {
      const locationIndex = gladysLocationIds.indexOf(location.additionalProperties.gladysHouseId);
      if (locationIndex >= 0) {
        gladysLocationIds.splice(locationIndex, 1);
        smtValidLocations.push(location);
      }
    }
  });

  const createdLocations = await gladysHouses
    .filter((house) => gladysLocationIds.includes(house.id))
    .map(async (house) => {
      return locationAPI.create(transformHouse(house, user), this.getToken(user));
    });

  return smtValidLocations.concat(createdLocations);
}

module.exports = {
  checkLocations,
};
