module.exports = get;

var queries = require('./device.queries.js');

function get(options) {

    // default params
    options = options || {};
    options.skip = parseInt(options.skip) || 0;
    options.take = parseInt(options.take) || 50;

    var query = queries.get;
    var params = [options.take, options.skip];
    
    // if the user wants to filter by service
    if(options.service) {
        query = queries.getByServicePaginated;
        params = [options.service, options.take, options.skip];
    }

    return gladys.utils.sql(query, params)
      .then((devices) => {
         
         // build a nested room object for the frontend
         devices.forEach((device, index) => {
            devices[index].room = {
                id: device.room,
                name: device.roomName
            };
         });
         
         return devices;
      });
}
