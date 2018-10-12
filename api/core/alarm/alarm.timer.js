
module.exports = function(alarm){
    
  // we create a new date in x seconds
  var t = new Date();
  t.setSeconds(t.getSeconds() + alarm.duration);
  alarm.datetime = t;
    
  // we delete duration
  delete alarm.duration;
    
  // we create the alarm
  return gladys.alarm.create(alarm);
};