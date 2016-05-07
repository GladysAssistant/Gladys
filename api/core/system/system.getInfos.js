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
   return Promise.resolve(infos);
};