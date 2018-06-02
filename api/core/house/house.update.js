var Promise = require('bluebird');

/**
 * @public
 * @description This function update an house
 * @name gladys.house.update
 * @param {Object} house
 * @param {integer} house.id The id of the house
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
 *      id: 1
 *      name: "Maison",
 *      address: "9 route de gien",
 *      city: "Paris",
 *      postcode: 90100,
 *      country: "france",
 *      latitude: 42,
 *      longitude: 43,
 * }
 * 
 * gladys.house.update(house)
 *      .then(function(house){
 *          // do something
 *      })
 */

module.exports = function update (house) {
  var id = house.id;
  delete house.id;
  
  return House.update({id}, house)
    .then(function(houses){
       if(houses.length === 0){
           return Promise.reject(new Error('NotFound'));
       } else {
           return Promise.resolve(houses[0]);
       }
    });
};