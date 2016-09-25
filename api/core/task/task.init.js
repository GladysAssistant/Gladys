const fs = require('fs');

module.exports = function(){
  
  // tasks started in dev and prod
  
  gladys.script.init();
  
  // load gladys brain
  gladys.brain.load()
    .then(function(){
        sails.log.info('Gladys brain loaded with success !');
    })
    .catch(function(){
        sails.log.error('Cannot load gladys.brain.');
    });
  
  
  if(sails.config.environment !== 'production') {
    return ;   
  }
  
  // tasks started only in prod
  fs.chmod(sails.config.update.updateScript, '755', function(err, result){
      if(err) return sails.log.error(err);
  });

  
  // checking for update now      
  gladys.update.checkUpdate();
  
  
  // install all modules not 
  // fully installed
  gladys.module.init();

  // Check for update interval
  setInterval(function(){
    gladys.update.checkUpdate();
  }, sails.config.update.checkUpdateInterval);  
 
};