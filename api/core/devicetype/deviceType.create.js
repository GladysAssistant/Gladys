const Promise = require('bluebird');
const queries = require('./deviceType.queries.js');

module.exports = function create(type){
    return deviceTypeExist(type)
      .then((exist) => {

          // if exist, update
          if(exist) {
              return DeviceType.update({id: exist.id}, type)
                               .then((rows) => {
                                   if(rows.length) return rows[0];
                                   else return null;
                               });
          } else {
              return DeviceType.create(type);
          }
      });
};

/**
 * Returns true if the deviceType exist
 */
function deviceTypeExist(type){
    if(type.device && type.identifier){
        return gladys.utils.sql(queries.getByDeviceAndIdentifier, [type.device, type.identifier])
                .then((rows) => {
                    if(rows.length) return rows[0];
                    else return false;
                });
    } else {
        return Promise.resolve(false);
    }
}