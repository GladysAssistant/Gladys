const Promise = require('bluebird');
const queries = require('./area.queries.js');

/**
 * @public
 * @description This function return all areas the user is currently in
 * @name gladys.area.userIn
 * @param {Object} user
 * @param {String} user.id The id of the user
 * @returns [{area}] areas
 * @example
 * var user = {
 *    id: 1
 * };
 *
 * gladys.area.userIn(user)
 *      .then((areas) => {
 *         // areas is an array of areas where the user is in currently
 *      })
 *      .catch((err) => {
 *          // something bad happened ! :/
 *      });
 */

module.exports = function userIn(user) {

  // Getting all areas + events linked to areas
  // The goal here is to rebuild the history of entering/leaving areas
  return Promise.all([
    gladys.utils.sql(queries.get, [user.id]), 
    gladys.utils.sql(queries.getLastAreaEventPerArea, [user.id])
  ])
    .spread((areas, events) => {

      var areasWhereTheUserIsStillIn = [];

      areas.forEach((area) => {
        var found = false;
        var i = 0;

        // we see if the last event seen about this area was an "enter-area" event, 
        // "left-area", or no event at all
        while(!found && i < events.length) {
          if(parseInt(events[i].value) === area.id) {
            found = true;
            if(events[i].code === 'enter-area') {
              areasWhereTheUserIsStillIn.push(area);
            }
          }
          i++;
        }
      });

      return areasWhereTheUserIsStillIn;
    });
};
