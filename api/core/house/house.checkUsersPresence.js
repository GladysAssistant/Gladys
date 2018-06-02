const queries = require('./house.queries.js');
const Promise = require('bluebird');

/**
 * @public
 * @description This function check if an user as at home and create an event in timeline
 * @name gladys.house.checkUserPresence
 * @example 
 * gladys.house.checkUserPresence();
 */

module.exports = function checkUsersPresence(){
    sails.log.info(`House : checkUsersPresence`);

    // first, get the time a user is considered not at home anymore
    return gladys.param.getValue('USER_TIME_BEFORE_CONSIDERING_LEFT_HOME')
        .then((timeBeforeLeftInMinute) => {

            // get all houses
            return [timeBeforeLeftInMinute, gladys.house.getAll()];
        })
        .spread((timeBeforeLeftInMinute, houses) => {

            return [houses, 
                Promise.map(houses, function(house) {  
                    return gladys.utils.sql(queries.getUserAtHomeAndNotSeenSince, [house.id, house.id, timeBeforeLeftInMinute]);
                })
            ];
        })
        .spread((houses, usersArray) => {

            // foreach house
            return Promise.map(houses, function(house, index) {

                // foreach user in this house and not put as 
                return Promise.map(usersArray[index], function(user) {
                    sails.log.info(`House : checkUserPresence : Putting user ${user.id} as left house : ${house.id}`);
                    return gladys.event.create({code: 'left-home', user: user.id, house: house.id});
                });
            });
        });
};