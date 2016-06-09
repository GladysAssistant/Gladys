var os = require('os');
var Promise = require('bluebird');

module.exports = function(){
   
   var infos = {
     hostname: os.hostname(),
     type: os.type(),
     plateform: os.platform(),
     arch: os.arch(),
     release: os.release(),
     uptime: os.uptime(),
     loadavg: os.loadavg(),
     totalmem: os.totalmem(),
     freemem: os.freemem(),
     cpus: os.cpus(),
     networkInterfaces: os.networkInterfaces()  
   };
   
   var usedMemory = infos.totalmem - infos.freemem;
   var percentMemoryUsed = 100*usedMemory/infos.totalmem;
   infos.percentMemoryUsed = percentMemoryUsed;
   
   return Promise.resolve(infos);
};