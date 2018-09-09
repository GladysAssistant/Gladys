var queries = require('./deviceType.queries.js');

module.exports = function(options){
  const query = Array.isArray(options.tag)
    ? queries.getDeviceTypeByTags
    : queries.getDeviceTypeByTag;
  return gladys.utils.sql(query, [options.tag]);
};