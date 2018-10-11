var os = require('os');
var osUtils 	= require('os-utils');
var Promise = require('bluebird');
const queries = require('./system.queries.js');

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
     freememPercentage: osUtils.freememPercentage(),
     cpus: os.cpus(),
     networkInterfaces: os.networkInterfaces(), 
     gladysVersion: gladys.version
   };
   
   infos.percentMemoryUsed = 100 - infos.freememPercentage;

   return Promise.all([
     gladys.utils.sqlUnique(queries.getNumberOfDeviceTypes, []),
     gladys.utils.sqlUnique(queries.getNumberOfDeviceStates, []),
     getCpuUsage()
   ])
   .spread((deviceTypeCount, deviceStateCount, cpuUsage) => {

    infos.deviceTypeCount = deviceTypeCount.count;
    infos.deviceStateCount = deviceStateCount.count;
    infos.cpuUsage = cpuUsage;

    return infos;
   });
};

function getCpuUsage() {
  return new Promise(function(resolve, reject){
    osUtils.cpuUsage((v) => {
      resolve(v);
    });
  });
}