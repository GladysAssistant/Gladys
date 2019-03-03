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
    });
}


/**
 * Execute the install function
 */
async function execInstallFunction(module){

  // if the module is not present, we remove it from the list
  if(!gladys.modules[module.slug]){
    return gladys.module.uninstall(module);
  }
   
  // we test if the module has an installation function
  if (typeof gladys.modules[module.slug].install !== 'function') {
     
    // module installed with success, because no installation function is needed
    return gladys.module.update({ id: module.id, status: 0 });
  }
   
  try {
    // we try installing the module
    await gladys.modules[module.slug].install();
    // if it succeeeds, we save status 0 in DB
    await gladys.module.update({ id: module.id, status: 0 });
  } catch(e) {
    sails.log.error(`Error while installing module ${module.slug}`);
    sails.log.error(e);
    // if not, the module is errored
    await gladys.module.update({ id: module.id, status: 2 });
  }
}