const Promise = require('bluebird');

module.exports = function (location){

  var newAreas = [];
  var leftAreas = [];
  var accuracy = location.accuracy || 0;

  return Promise.all([
    gladys.area.getDistance(location),
    gladys.area.userIn({id: location.user})
  ])
    .spread((areasByDistance, lastAreasUser) => {

      lastAreasUser.forEach(function(lastArea) {
        areasByDistance.forEach(function(areaDistance) {
          // We check for each area where the user is inside, if the user has left it (ie: distance  > radius + accuracy), if so, we push the area in leftAreas
          if(areaDistance.id === lastArea.id && areaDistance.distance > (areaDistance.radius + accuracy)) {
            leftAreas.push(areaDistance);
          }
          if(areaDistance.id === lastArea.id && areaDistance.distance <= (areaDistance.radius + accuracy)) {
            // user stil in this area, we just log it
            sails.log.info(`User ${location.user} detected in area ${areaDistance.name}`);
          }
        });
      });

      // Then, we check the opposite. Did the user entered a new area ?
      // Firf we remove all the areas the user is in from array aresByDistance
      for(var i = areasByDistance.length - 1; i >= 0; i--){
        for( var j = 0; j < lastAreasUser.length; j++){
          if(areasByDistance[i] && (areasByDistance[i].id === lastAreasUser[j].id)) {
            areasByDistance.splice(i, 1);
          }
        };
      };

      // Then for all this areas, we check the user has not entered in (with strict distance verification (we don't take accuracy into account here)
      areasByDistance.forEach(function(areaDistance) {
        if(areaDistance.distance < areaDistance.radius) {
          newAreas.push(areaDistance);
          sails.log.info(`User ${location.user} detected in area ${areaDistance.name}`);
        }
      });

      // we now have an array of areas the user in
      return {newAreas, leftAreas};
    });
};
