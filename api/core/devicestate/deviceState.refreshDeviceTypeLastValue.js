const Promise = require('bluebird');
const queries = require('./deviceState.queries');

module.exports = function refreshDeviceTypeLastValue() {
    sails.log.info(`refreshDeviceTypeLastValue: Generating all deviceType last value`);

    return gladys.utils.sql(queries.getAllDeviceType, [])
        .then((deviceTypes) => {
            sails.log.info(`refreshDeviceTypeLastValue: Found ${deviceTypes.length} deviceTypes.`);

            return Promise.map(deviceTypes, (deviceType) => {
                return gladys.utils.sql(queries.getLastDeviceState, [deviceType.id])
                    .then((deviceStates) => {
                        if(deviceStates.length === 0) return null;

                        sails.log.info(`refreshDeviceTypeLastValue: Saving deviceType ID = ${deviceType.id} with last value = ${deviceStates[0].value}, datetime = ${deviceStates[0].datetime}.`);
                        return gladys.utils.sql(queries.updateDeviceTypeLastValue, [deviceStates[0].value, deviceStates[0].datetime, deviceStates[0].devicetype, deviceStates[0].datetime]);
                    });
            }, {concurrency: 2});
        });
};