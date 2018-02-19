const fs = require('fs');
const schedule = require('node-schedule');

module.exports = function(cb){
  
  // tasks started in dev and prod
  gladys.script.init();

  // start sunrise & sunset schedule
  gladys.sun.init().catch(sails.log.warn);
  
  // load gladys brain
  gladys.brain.load()
    .then(function(){
        sails.log.info('Gladys brain loaded with success !');
        cb();
    })
    .catch(function(){
        sails.log.error('Cannot load gladys.brain.');
    });

   gladys.alarm.checkAllAutoWakeUp();
  
  if(sails.config.environment !== 'production') {
    return ;   
  }
  
  
  // tasks started only in prod

  fs.chmod(sails.config.update.updateScript, '755', function(err, result){
      if(err) return sails.log.error(err);
  });


  // start sunrise & sunset schedule each day at 00.01 
  // start auto wake up feature each day at 00.01 
  var rule = new schedule.RecurrenceRule();
  rule.hour = 0;
  rule.minute = 1;

  var j = schedule.scheduleJob(rule, function(){
      gladys.sun.init().catch(sails.log.warn);
      gladys.alarm.checkAllAutoWakeUp().catch(sails.log.warn);
  });

  // schedule alarm
  gladys.alarm.init().catch(sails.log.error);
  
  // checking for update now      
  gladys.update.checkUpdate();

  // be sure that Gladys has socket notification type
  gladys.socket.createNotificationType();

  // check if db mgiration is needed
  gladys.task.checkDbVersion();
  
  // install all modules not 
  // fully installed
  gladys.module.init();

  // Check for update interval
  setInterval(function(){
    gladys.update.checkUpdate();
  }, sails.config.update.checkUpdateInterval);  
 
};