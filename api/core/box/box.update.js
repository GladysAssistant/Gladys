/**
 * @public
 * @description This function update an box
 * @name gladys.box.update
 * @param {Object} box
 * @param {integer} box.id The id of the box
 * @param {boxtype} box.boxtype The id of the boxType
 * @param {integer} box.x The x position of the box
 * @param {integer} box.y The y position of the box
 * @param {text} box.param JSON of the box's parameters
 * @param {integer} box.user The id of the box's user
 * @returns {box} box
 * @example
 * var box = {
 *      id: 1,
 *      boxtype: 2,
 *      x: 2,
 *      y: 1,
 *      param: {"first param":"hello world !"}
 *      user: 1
 * };
 *
 * gladys.box.update(box)
 *      .then(function(box){
 *         // box updated ! 
 *      })
 *      .catch(function(err){
 *          // something bad happened ! :/
 *      });
 */

module.exports = function(box){
  var id = box.id;
  delete box.id;
  if(box.params) box.params = JSON.stringify(box.params);
  return Box.update({id}, box);  
};