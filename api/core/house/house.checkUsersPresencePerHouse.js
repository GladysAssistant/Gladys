const queries = require('./house.queries.js');
const Promise = require('bluebird');

/**
 * @public
 * @description This function check if an user as at home and create an event in timeline for a given house
 * @name gladys.house.checkUserPresencePerHouse
 * @example 
 * gladys.house.checkUserPresencePerHouse();
 */

module.exports = function checkUsersPresencePerHouse(house){
  sails.log.info(`House : checkUsersPresencePerHouse`);

  return gladys.param.getValue('USER_TIME_BEFORE_CONSIDERING_LEFT_HOME')
    .then((timeBeforeLeftInMinute) => {
      return timeBeforeLeftInMinute;
    })
    .catch(() => {
      return 10;
    })
    .then((timeBeforeLeftInMinute) => {
      return gladys.utils.sql(queries.getUserAtHomeAndNotSeenSince, [house.id, house.id, timeBeforeLeftInMinute]);
    })
    .then((usersArray) => {

      // foreach user in this house and not seen since, we put them left-home
      return Promise.map(usersArray, function(user) {
        sails.log.info(`House : checkUserPresencePerHouse : Putting user ${user.id} as left house : ${house.id}`);
        return gladys.event.create({code: 'left-home', user: user.id, house: house.id});
      });
    });
};
