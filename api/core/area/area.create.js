
/**
 * @public
 * @description This function create an area
 * @name gladys.area.create
 * @param {Object} area
 * @param {String} area.name The name of the area
 * @param {latitude} area.latitude The latitude of the area
 * @param {longitude} area.longitude The longitude of the area
 * @param {integer} area.radius The radius of the area
 * @param {integer} area.user The id of the area's user
 * @returns {area} area
 * @example
 * var area = {
 *      name: 'My Home !',
 *      latitude: 42,
 *      longitude: 3,
 *      radius: 40,
 *      user: 1
 * };
 *
 * gladys.area.create(area)
 *      .then(function(area){
 *         // area created ! 
 *      })
 *      .catch(function(err){
 *          // something bad happened ! :/
 *      });
 */

module.exports = function(area){
    return Area.create(area);
};