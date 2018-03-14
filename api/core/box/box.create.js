/**
 * @public
 * @description This function create an box
 * @name gladys.box.create
 * @param {Object} box
 * @param {boxtype} box.boxtype The id of the boxType
 * @param {integer} box.x The x position of the box
 * @param {integer} box.y The y position of the box
 * @param {integer} box.user The id of the box's user
 * @returns {box} box
 * @example
 * var box = {
 *      boxtype: 1,
 *      x: 1,
 *      y: 1,
 *      user: 1
 * };
 *
 * gladys.box.create(box)
 *      .then(function(box){
 *         // box created ! 
 *      })
 *      .catch(function(err){
 *          // something bad happened ! :/
 *      });
 */

module.exports = function create(box){
    return Box.create(box);
};