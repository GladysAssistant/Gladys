var queries = require('./module.queries.js');
var Promise = require('bluebird');
var fse = require('fs-extra');

module.exports = function(module){

    // if the module is installed remotely, send the info
    if(module.machine && module.machine.length){
        params.machine_id = params.machine;
        gladys.emit('module-uninstall', module);
        return Promise.resolve(module);
    }
    
    // getting module in DB
    return gladys.utils.sqlUnique(queries.getById, [module.id])
      .then(function(module){
          
          // if module uninstall function exist
          if(gladys.modules[module.slug] && typeof gladys.modules[module.slug].uninstall == "function"){
              
              // calling uninstall function
              return [module, gladys.modules[module.slug].uninstall()];
          } else {
              return [module, null];
          }   
      })
      .spread((module) => {
         
         // we delete the folder
         var modulePath = './api/hooks/' + module.slug;
         var assetsDestinationProd = './www/hooks/' + module.slug;
         var assetsDestinationDev = './assets/hooks/' + module.slug; 

         return [module, fse.remove(modulePath), fse.remove(assetsDestinationProd), fse.remove(assetsDestinationDev)];
      })
      .spread((module) => {
         
         // deleting module in DB
         return [module, gladys.utils.sql(queries.delete, [module.id])];
      })
      .spread(function(module){
          
          return module;
      });
};