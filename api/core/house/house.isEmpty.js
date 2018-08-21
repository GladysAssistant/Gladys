/**
 * @public
 * @description This function retunr an house
 * @name gladys.house.getUsers
 * @param {Object} house
 * @param {integer} house.id The id of the house
 * @returns {House} house
 * @example
 * var house = {
 *      id: 1
 * }
 * 
 * gladys.house.getById(house)
 *      .then(function(isEmpty){
 *          if(isEmpty){
 *              //House is not empty
 *          }else{
 *              //House is empty
 *          }
 *      })
 */

module.exports = function(options){
  
  // we get users in house
  return gladys.house.getUsers(options)  
    .then(function(users){
        
        // if there are user inside, return false
        if(users.length) return false;
        
        return true;
    });
};