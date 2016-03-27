var queries = require('./box.queries.js');

module.exports = function (options){
  return gladys.utils.sql(queries.getBoxUser, [options.user.id])
    .then(function(boxs){
        
        // build a nested boxtype object for the frontend
         boxs.forEach(function(box, index){
            boxs[index].boxType = {
                id: box.boxTypeId,
                title: box.boxTypeTitle
            };
         });
         
         return boxs;
    });
};