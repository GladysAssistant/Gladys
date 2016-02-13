module.exports = get;

var queries = require('./device.queries.js');

function get (options) {
    return new Promise(function (resolve, reject){
        options = options || {};
        options.skip = parseInt(options.skip) || 0;
        options.take = parseInt(options.take) || 50;
    
        Device.query(queries.get, [options.take, options.skip], function(err, devices){
            if(err) return reject(err);
            
            resolve(devices);
        });
    });
}