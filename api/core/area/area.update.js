var Promise = require('bluebird');

/**
 * @public
 * @description This function update an area
 * @name gladys.area.update
 * @param {Object} area
 * @param {integer} area.id The id of the area
 * @param {String} area.name The name of the area
 * @param {latitude} area.latitude The latitude of the area
 * @param {longitude} area.longitude The longitude of the area
 * @param {integer} area.radius The radius of the area
 * @param {integer} area.user The id of the area's user
 * @returns {area} area
 * @example
 * var area = {
 *      id: 1
 *      name: 'My area updated',
 *      latitude: 42,
 *      longitude: 3,
 *      radius: 40,
 *      user: 1
 * };
 *
 * gladys.area.update(area)
 *      .then(function(area){
 *         // area updated ! 
 *      })
 *      .catch(function(err){
 *          // something bad happened ! :/
 *      });
 */


module.exports = function(area){
   var id = area.id;
   delete area.id;
   return Area.update({id}, area)
      .then(function(areas){
         if(areas.length){
             return areas[0];
         } else {
             return Promise.reject(new Error('NotFound'));
         }
      });
}