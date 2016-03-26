
module.exports = function(){
  
  if(sails.config.environment !== 'production') {
    return ;   
  }
  
  // checking for update now      
  gladys.update.checkUpdate();

  // Check for update interval
  setInterval(function(){
    gladys.update.checkUpdate();
  }, sails.config.update.checkUpdateInterval);  
 
};