var uuid = require('uuid');

/**
 * @public
 * @description This function create an house
 * @name gladys.house.create
 * @param {Object} house
 * @param {String} house.name The name of the house
 * @param {String} house.address The address of the house
 * @param {String} house.city The city of the house
 * @param {integer} house.postcode The postcode of the house
 * @param {String} house.country The country of the house
 * @param {float} house.latitude The latitude of the house
 * @param {float} house.longitude The longitude of the house
 * @returns {House} house
 * @example
 * var house = {
 *      name: "Maison",
 *      address: "9 route de gien",
 *      city: "Paris",
 *      postcode: 90100,
 *      country: "france",
 *      latitude: 42,
 *      longitude: 43,
 * }
 * 
 * gladys.house.create(house)
 *      .then(function(house){
 *          // do something
 *      })
 */

module.exports = function(house){
    house.uuid = house.uuid || uuid.v4();
    return House.create(house);
};