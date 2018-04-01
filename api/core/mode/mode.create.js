var queries = require('./mode.queries.js');

/**
 * @public
 * @description This function create an mode
 * @name gladys.mode.create
 * @param {Object} mode
 * @param {String} mode.code The code of the mode, it must be unqiue
 * @param {String} mode.name The name of the mode
 * @param {String} mode.description The description of the mode
 * @returns {Mode} mode
 * @example
 * var mode = {
 *      code: "romantic"
 *      name: "romantic ;)",
 *      description: "it's the romantic mode",
 * }
 * 
 * gladys.mode.create(mode)
 *      .then(function(mode){
 *          // mode created
 *      })
 */

module.exports = function create(mode){
    
    // checking if mode already exist
    return gladys.utils.sql(queries.getByCode, [mode.code])
      .then(function(modes){
         
         if(modes.length){
             
             // mode already exist
             return Promise.resolve(modes[0]);
         } else {
             
             sails.log.info(`Mode : create : Creating mode ${mode.code}`);
             return Mode.create(mode);
         }
      });
};