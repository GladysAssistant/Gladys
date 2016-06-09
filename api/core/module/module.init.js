module.exports = init;

var queries = require('./module.queries.js');
var Promise = require('bluebird');

/**
 * If a module need to execute an install routine after being install
 * (downloading some data for example)
 * Gladys will call an install function on the module
 */
function init(){
    return gladys.utils.sql(queries.getFreshInstalledModule, [])
      .then(function(modules){
          
         // foreach module, exec install function
         return Promise.map(modules, function(module){
             return execInstallFunction(module);
         });
      })
      .then(function(modules){
        
         // foreach module, we update in db with the current status
         return Promise.map(modules, function(module){
           return gladys.module.update(module);
         });
      });
}


/**
 * Execute the install function
 */
function execInstallFunction(module){
   
   // we test if the module has an installation function
   if (typeof gladys.modules[module.slug].install !== "function") {
     
     // module installed with success, because no installation function is needed
     module.status = 0;
     return Promise.resolve(module);
   }  
   
   return gladys.modules[module.slug].install()
     .then(function(){
       
       // module installed with success
       module.status = 0;
       return module;
     })
     .catch(function(){
       
       // error while installing the module
       module.status = 2;
       return module;
     });
}