var queries = require('./deviceState.queries.js');
var downsampler = require("downsample-lttb");

/**
 * @public
 * @description This function return all deviceState filtered by date
 * @name gladys.deviceState.getFiltered
 * @param {Object} options
 * @param {integer} options.threshold The percentage reduction of the number of states
 * @param {Date} options.startDate The date from which you want deviceState
 * @param {Date} options.endDate The date until which you want deviceState
 * @returns {Array<deviceStates>} deviceStates
 * @example
 * var options = {
 *      threshold: 50,
 *      startDate: 2018-08-27 8:29:13,
 *      endDate: 2018-08-28 8:29:13
 * }
 * gladys.deviceState.getFiltered(options)
 *      .then(function(deviceStates){
 *          // do something
 *      })
 */
module.exports = function getFiltered(options){
  options.threshold = parseInt(options.threshold) || 50;

  if(options.devicetype) {
    return gladys.utils.sql(queries.getByDeviceTypeFiltered, [options.devicetype, options.startDate, options.endDate])
      .then((states) => {
        return downsampled(states,options.threshold)
      });
  } else {
    return gladys.utils.sql(queries.getFiltered, [options.startDate, options.endDate])
      .then((states) => {
        return downsampled(states,options.threshold)
      });
  }
};

function downsampled(states,threshold) {
  var XY = states.map(dataXY); //conversion to [[X,Y0],...,[Xn,Yn]]
  var downsampledXY = downsampler.processData(XY, Math.round(Object.keys(XY).length * threshold / 100)); //Downsampling at 'threshold' %
  return downsampledXY.map(jsonXY); // conversion to [{datetime:D0, value:Y0},...,{datetime:Dn, value:Yn}]

};

function dataXY(item) {
  var XY = [item.datetime,item.value];
  return XY;
};

function jsonXY(item) {
  var XY = {"x":item[0], "y":item[1]};
  return XY;
};
