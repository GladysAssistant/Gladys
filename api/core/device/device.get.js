module.exports = get;

var queries = require('./device.queries.js');

function get (options) {
    
  // default params
  options = options || {};
  options.skip = parseInt(options.skip) || 0;
  options.take = parseInt(options.take) || 50;
    
  return gladys.utils.sql(queries.get, [options.take, options.skip]);
}