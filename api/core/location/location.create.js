var Promise = require('bluebird');

/**
 * @public
 * @description This function create an location
 * @name gladys.location.create
 * @param {Object} location
 * @param {float} location.latitude The latitude of location
 * @param {float} location.longitude The longitude of location
 * @param {float} location.altitude The altitude of location (optional)
 * @param {float} location.accuracy The accuracy of location (optional)
 * @returns {Location} location
 * @example
 * var location = {
 *      latitude: 'wakeup',
 *      longitude: 1,
 *      altitude: 1,
 *      accuracy: 2
 * };
 *
 * gladys.location.create(location)
 *      .then(function(location){
 *         // location created ! 
 *      })
 *      .catch(function(err){
 *          // something bad happened ! :/
 *      });
 */

module.exports = function create (location) {
   sails.log.debug(`gladys.location.create : Create location for user ${location.user}`);
   location.datetime = location.datetime || new Date();
  
  // we check if the user did not enter a new area
  return gladys.area.changeArea(location)
    .then(function(result){  
        
       // foreach area the user entered in, we emit a new event
       var insertNewAreaEvents = Promise.map(result.newAreas, function(area){
            return gladys.event.create({
                code: 'enter-area',
                user: location.user,
                value: area.name,
                scope: area
            });
        });
        
        // foreach area the user left, we emit a new event
        var insertLeftAreaEvents = Promise.map(result.leftAreas, function(area){
            return gladys.event.create({
                code: 'left-area',
                user: location.user,
                value: area.name,
                scope: area
            });
        });
        
       return Promise.all(insertNewAreaEvents, insertLeftAreaEvents);
    })
    .then(function(){
        
        // we create the location in database
        return Location.create(location);
    })
    .then((location) => {
        
        // broadcast news to everyone
        gladys.socket.emit('newLocation', location);

        return location; 
    });
};