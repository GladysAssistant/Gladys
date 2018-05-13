 **
 * @public
 * @description This function return true or false is it the a.m.
 * @name gladys.time.isItAM
 * @param {Object} house
 * @param {integer} house.house The id of the house
 * @returns {House} house
 * 
 * @example
 * var house = {
 *	house: '1'
 * };
 * 
 * gladys.time.isItAM(house)
 *      .then(function(isItAM){
 *          if(isItAM){
 *              //The time in the selected house is in the night.
 *          }else{
 *              //The time in the selected house is not in the night.
 *          }
 *      });
 */

module.exports = function isItAM(options){
    return gladys.time.getMomentOfTheDay(options)
      .then((result) => {
          if(result.state === 'morning') return true; 
          return false;
      });
};
