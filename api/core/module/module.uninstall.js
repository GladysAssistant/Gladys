var queries = require('./module.queries.js');
var Promise = require('bluebird');
var fse = require('fs-extra');

module.exports = function(module){
    
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
      .spread(function(module){
         
         // we delete the folder
         var path = './api/hooks/' + module.slug;
         
         return [module, removeDir(path)];
      })
      .spread(function(module){
         
         // deleting module in DB
         return [module, gladys.utils.sql(queries.delete, [module.id])];
      })
      .spread(function(module){
          
          return module;
      });
};

function removeDir(path){
    return new Promise(function(resolve, reject){
          fse.remove(path, function (err) {
            if (err) return reject(err)

            resolve();
          });
    });
}