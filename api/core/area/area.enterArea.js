var queries = require('./area.queries.js');

module.exports = function enterArea(location){
   return gladys.area.inArea(location)
     .then(function(areas){
         return [getLastAreas(location.user), areas];
     })
     .spread(function(lastAreasUser, areas){
       
        areas.forEach(function(area){
            sails.log.info(`User ${location.user} detected in area ${area.name}`); 
        });
                
        // we remove the areas where the user was already in
        return removeDuplicateArea(lastAreasUser, areas);
     });
};


/** 
 * Return the last area where the user was located before
 */
function getLastAreas(userId){
    return gladys.utils.sql(queries.lastLocationUser, [userId])
      .then(function(locations){
         
         // if the user was never located before
         if(locations.length === 0) {
             return [];
         } else {
             return gladys.area.inArea(locations[0]);
         }
      });
}

function removeDuplicateArea(lastAreasUser, areas){
    
    var newAreas = [];
    
    // foreach new area, we test if the area is
    // present in the old area (means that the user did not enter the area)
    areas.forEach(function(area){
        var found = false;
        var i = 0;
        while(!found && i < lastAreasUser.length){
            if(lastAreasUser[i].id === area.id){
                found = true;
            }
            i++;
        }
        if(!found){
            newAreas.push(area);
        }
    });
    return newAreas;
}