/**
 * @public
 * @description This function return true or false, test if it's night.
 * @name gladys.time.isItNight
 * @param {Object} house
 * @param {integer} house.house The id of the house
 * @returns {House} house
 * 
 * @example
 * var house = {
 *	house: '1'
 * };
 * 
 * gladys.time.isItNight(house)
 *      .then(function(isItNight){
 *          if(isItNight){
 *              //The time in the selected house is night.
 *          }else{
 *              //The time in the selected house is not night.
 *          }
 *      });
 */


module.exports = function isItNight(options){
    return gladys.time.getMomentOfTheDay(options)
      .then((result) => {
          if(result.state === 'night') return true; 
          return false;
      });
};
