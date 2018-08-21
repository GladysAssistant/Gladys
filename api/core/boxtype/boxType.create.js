var queries = require('./boxType.queries.js');

/**
 * @public
 * @description This function create an boxType
 * @name gladys.boxType.create
 * @param {Object} boxType
 * @param {String} boxType.uuid The uuid of the boxType
 * @param {String} boxType.title The title of the boxType
 * @param {String} boxType.path The path of the boxType.ejs file 
 * @param {String} boxType.view The view where the boxType should be displayed
 * @returns {boxType} boxType
 * @example
 * var boxType = {
 *      uuid: "18f956ff-9953-4be9-891f-0f379a4ec167", //This is an example, do not use it
 *      title: "My boxType",
 *      path: "views/boxs/my-box.ejs", 
 *      view: "dashboard" 
 * };
 *
 * gladys.boxType.create(boxType)
 *      .then(function(boxType){
 *         // boxType created ! 
 *      })
 *      .catch(function(err){
 *          // something bad happened ! :/
 *      });
 */

module.exports = function create(boxType){
  
  return gladys.utils.sql(queries.getByUuid, [boxType.uuid])
    .then((result) => {

        // if boxType already exist, updating
        if(result.length > 0) return BoxType.update({id: result[0].id}, boxType);
        else return BoxType.create(boxType);
    });
};