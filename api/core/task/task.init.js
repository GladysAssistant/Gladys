const fs = require('fs');
const schedule = require('node-schedule');

module.exports = function(cb){
  
  // tasks started in dev and prod
  gladys.script.init();

  // start sunrise & sunset schedule
  gladys.sun.init().catch(sails.log.warn);
  
  gladys.brain.load()
    .then(() => {
        sails.log.info('Gladys brain loaded with success !');
    })
    .catch((err) => {
        sails.log.error(`Error while loading brain ` + err);
    });


   gladys.alarm.checkAllAutoWakeUp();
  
  if(sails.config.environment !== 'production') {
    return cb();   
  }

    // check if db migration is needed
   gladys.task.checkDbVersion()
    .then(() => {
        sails.log.info('Successfully checked DB version.');
        cb();
    })
    .catch((err) => {
        sails.log.error(`Error while performing DB migration.`);
        sails.log.error(err);
        cb();
    });
  
  
  // tasks started only in prod


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
  
  // install all modules not 
  // fully installed
  gladys.module.init();

  // Check for update interval
  setInterval(function(){
    gladys.update.checkUpdate();
  }, sails.config.update.checkUpdateInterval);  
 
};