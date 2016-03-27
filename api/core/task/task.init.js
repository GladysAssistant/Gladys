
module.exports = function(){
  
  // tasks started in dev and prod
  gladys.script.init();
  
  // load gladys brain
  gladys.brain.load()
    .then(function(){
        sails.log.info('Gladys brain loaded with success !');
    })
    .catch(function(){
        sails.log.err('Cannot load gladys.brain.');
    });
  
  
  if(sails.config.environment !== 'production') {
    return ;   
  }
  
  // tasks started only in prod
  
  // checking for update now      
  gladys.update.checkUpdate();

  // Check for update interval
  setInterval(function(){
    gladys.update.checkUpdate();
  }, sails.config.update.checkUpdateInterval);  
 
};