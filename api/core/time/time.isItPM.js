 /**
 * @public
 * @description This function return true or false, test if it's afternoon.
 * @name gladys.time.isItPM
 * @param {Object} house
 * @param {integer} house.house The id of the house
 * @returns {House} house
 * 
 * @example
 * var house = {
 *	house: '1'
 * };
 * 
 * gladys.time.isItPM(house)
 *      .then(function(isItPM){
 *          if(isItPM){
 *              //The time in the selected house is afternoon.
 *          }else{
 *              //The time in the selected house is not afternoon.
 *          }
 *      });
 */

module.exports = function isItPM(options){
    return gladys.time.getMomentOfTheDay(options)
      .then((result) => {
          if(result.state === 'afternoon') return true; 
          return false;
      });
};
