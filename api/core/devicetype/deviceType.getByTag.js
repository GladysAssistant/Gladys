var queries = require('./deviceType.queries.js');

/**
 * options must have a tag attribute
 * tag can be a simple string or an array of string to match multiple tags
 * So {tag: 'myTag'} and {tag: ['myTag', 'anotherTag']} are both valid
 * @param options
 */
module.exports = function(options){
  return gladys.utils.sql(queries.getDeviceTypeByTags, [options.tag]);
};