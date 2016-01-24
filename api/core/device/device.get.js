module.exports = get;

var queries = require('./device.queries.js');

function get (options) {
    options = options || {};
    options.offset = options.offset || 0;
    options.limit = options.limit || 50;
    
    return new Promise(function (resolve, reject){
        Device.query(queries.get, [options.limit, options.offset], function(err, devices){
            if(err) return reject(err);
            
            resolve(devices);
        });
    });
}