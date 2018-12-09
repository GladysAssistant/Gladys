var queries = require('./area.queries.js');

module.exports = function (location){
  var lat = location.latitude;
  var long = location.longitude;
  return gladys.utils.sql(queries.getDistance, [lat, lat, long, location.user]);  
};
