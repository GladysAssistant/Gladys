var Promise = require('bluebird');

/**
 * @public
 * @description This function update an boxType
 * @name gladys.boxType.update
 * @param {Object} boxType
 * @param {integer} boxType.id The id of the boxType
 * @param {String} boxType.uuid The uuid of the boxType
 * @param {String} boxType.title The title of the boxType
 * @param {String} boxType.path The path of the boxType.ejs file 
 * @param {String} boxType.view The view where the boxType should be displayed
 * @returns {boxType} boxType
 * @example
 * var boxType = {
 *      id: 1,
 *      uuid: "18f956ff-9953-4be9-891f-0f379a4ec167", //This is an example, do not use it
 *      title: "New title of My boxType",
 *      path: "views/boxs/my-box.ejs", 
 *      view: "dashboard" 
 * };
 *
 * gladys.boxType.update(boxType)
 *      .then(function(boxType){
 *         // boxType updated ! 
 *      })
 *      .catch(function(err){
 *          // something bad happened ! :/
 *      });
 */

module.exports = function update(boxType){
  var id = boxType.id;
  delete boxType.id;
  return BoxType.update({id}, boxType)
    .then(function(types){
       if(types.length === 0){
           return Promise.reject(new Error('NotFound'));
       } 
       
       return types[0];
    });
};