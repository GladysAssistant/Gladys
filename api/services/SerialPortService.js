/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */
 
/**
 * Description
 * @method motionSensorExist
 * @param {} code
 * @param {} callback
 * @return 
 */
function motionSensorExist(code,callback){
    MotionSensor.findOne({code : code}, function(err, motionSensor){
          if(err) return sails.log.warn('SerialPortService : motionSensorExist : ' + err);

          if(callback)
            callback(motionSensor);
    });
} 


module.exports = {
	 
    /**
     * Description
     * @method startListening
     * @return 
     */
    startListening : function(){
      // if serial port is not used
      if(!sails.config.serialport.active)
        return ;
      

        var lastTimeDataReceived = [];
        var serialport = require("serialport");
        var SerialPort = serialport.SerialPort; 
        
          var sp = new SerialPort(sails.config.serialport.name, {
              parser: serialport.parsers.readline("\n")
          }, false);

        sp.on('error', function(err) {
          sails.log.warn(err);
        });

        sp.open(function (err) {
          if (err) {
             sails.log.warn(err);
             return;
          }

          // each time a serial port message is received
          sp.on("data", function (data) {
         
            try
            {
              // trying to parse JSON received
               var  result = JSON.parse(data);
            }
            catch(e)
            {
               sails.log.warn('Invalid JSON received from serial port');
            }
            
            if(result && result[0]['action'] == "received")
            {
                var actual_time = (new Date()).getTime();
                sails.log.info('SerialPortService : Signal received : '+ result[0]['value']);
                // if serial port message received after the wait time between two same values
                if(typeof(lastTimeDataReceived[result[0]['value']]) == "undefined" || (actual_time - lastTimeDataReceived[result[0]['value']]) >= sails.config.serialport.timeBeforeNewReceive )
                {
                  motionSensorExist(result[0]['value'], function(motionSensor){
                        if(motionSensor){
                            // save motion and fire motion event
                            MotionService.motion(result[0]['value'], function(err){
                                if(err) return sails.log.warn(err);
                            }); 
                        }else{
                            if(RFListenerService.isWaiting()){
                                // if we are waiting for a new device to connect, let's add it to the known sensors
                                RFListenerService.addSensor(result[0]['value']);
                            }else{
                                // Trigger an event 'received433UnknownValue' with the received value
                                ScenarioService.launcher(sails.config.lifeevent.received433UnknownValue.name, result[0]['value']);
                            }
                        }
                  });
                  
                  // Updating lastTimeDataReceived for the value
                  lastTimeDataReceived[result[0]['value']] = (new Date()).getTime();
                }
            }
          });

      });

    },

	
};