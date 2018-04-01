var queries = require('./box.queries.js');

/**
 * @public
 * @description This function return all box of one user
 * @name gladys.box.getBoxUser
 * @param {Object} options
 * @param {Object} options.user
 * @param {integer} options.user.id The id of the user's boxs
 * @returns {Array<boxs>} box
 * @example
 * var options = {
 *     user : {
 *         id : 1
 *     }
 * }
 *
 * gladys.box.getBoxUser(options)
 *      .then(function(boxs){
 *         // all boxs of this user ! 
 *      })
 *      .catch(function(err){
 *          // something bad happened ! :/
 *      });
 */

module.exports = function (options){
  return gladys.utils.sql(queries.getBoxUser, [options.user.id])
    .then(function(boxs){
        
        // build a nested boxtype object for the frontend
         boxs.forEach(function(box, index){
            boxs[index].boxType = {
                id: box.boxTypeId,
                title: box.boxTypeTitle
            };
         });
         
         return boxs;
    });
};