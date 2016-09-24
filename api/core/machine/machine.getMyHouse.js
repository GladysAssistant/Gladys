var queries = require('./machine.queries.js');

/**
 * Returns the house where the machine which is running current Gladys instance
 * is located.
 * Example: You have a Raspberry Pi running Gladys. This Raspberry Pi
 * is located in house 1. Calling this function will return house 1.
 */
module.exports = function getMyHouse(){
    return gladys.utils.sqlUnique(queries.getMyHouse, []);
};