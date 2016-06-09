var Promise = require('bluebird');

module.exports = function(area){
   var id = area.id;
   delete area.id;
   return Area.update({id}, area)
      .then(function(areas){
         if(areas.length){
             return areas[0];
         } else {
             return Promise.reject(new Error('NotFound'));
         }
      });
}