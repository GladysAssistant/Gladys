var queries = require('./deviceType.queries.js');

module.exports = function(device){
    return gladys.utils.sql(queries.getByDevice, [device.id]);
};
