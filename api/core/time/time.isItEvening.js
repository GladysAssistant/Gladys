/**
 * @public
 * @description This function return true or false, test if it's evening.
 * @name gladys.time.isItEvening
 * @param {Object} house
 * @param {integer} house.house The id of the house
 * @returns {House} house
 * 
 * @example
 * var house = {
 *	house: '1'
 * };
 * 
 * gladys.time.isItEvening(house)
 *      .then(function(isItEvening){
 *          if(isItEvening){
 *              //The time in the selected house is evening.
 *          }else{
 *              //The time in the selected house is not evening.
 *          }
 *      });
 */

module.exports = function isItEvening(options) {
    return gladys.time.getMomentOfTheDay(options)
      .then((result) => {
          if(result.state === 'evening') return true; 
          return false;
      });
};
