var Promise = require('bluebird');

module.exports = function(launcher){
  var id = launcher.id;
  delete launcher.id;
  return Launcher.update({id}, launcher)
    .then(function(launchers){
      if(launchers.length){
        return launchers[0];
      } else {
        return Promise.reject(new Error('NotFound'));
      }
    });
};