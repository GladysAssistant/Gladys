const queries = require('./area.queries.js');
const Promise = require('bluebird');

module.exports = function enterArea(location) {

   return Promise.all([
       gladys.area.inArea(location),
       gladys.area.userIn({id: location.user})
   ])
    .spread((areas, lastAreasUser) => {

        areas.forEach(function(area){
            sails.log.info(`User ${location.user} detected in area ${area.name}`); 
        });
                
        // we remove the areas where the user was already in
        var newAreas = removeDuplicateArea(lastAreasUser, areas);
        var leftAreas = findLeftAreas(lastAreasUser, areas);
        
        return {newAreas, leftAreas};
    });
};


function findLeftAreas(lastAreasUser, areas){
    
    var leftAreas = [];
    
    lastAreasUser.forEach(function(lastAreaUser){
        var found = false;
        var i = 0;
        while(!found && i < areas.length){
            if(areas[i].id === lastAreaUser.id){
                found = true;
            }
            i++;
        }
        if(!found){
            leftAreas.push(lastAreaUser);
        }
    });
    
    return leftAreas;
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