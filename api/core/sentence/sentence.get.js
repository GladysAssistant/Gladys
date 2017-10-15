var queries = require('./sentence.queries.js');

module.exports = function(options){
  options = options || {};
  options.skip = parseInt(options.skip) || 0;
  options.take = parseInt(options.take) || 50;
  options.status = options.status || false;
  
  var query = queries.get;
  
  if(options.status === 'official') query = queries.getOffical;
  if(options.status === 'approved') query = queries.getApproved;
  if(options.status === 'rejected') query = queries.getRejected;
  if(options.status === 'pending') query = queries.getPending;

  return gladys.utils.sql(query, [options.take, options.skip]);
};

