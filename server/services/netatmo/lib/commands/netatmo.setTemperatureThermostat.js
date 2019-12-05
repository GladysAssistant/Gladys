/**
 * @description Connect.
 * @example
 * netatmo.setTemperatureThermostat();
 */
function setTemperatureThermostat(device_id, module_id, setpoint_temp) {
    return new Promise(resolve => {
        const options = {
            device_id: device_id,
            module_id: module_id,
            setpoint_mode: 'manual',
            setpoint_temp: setpoint_temp,
        };
        const response = this.api.setThermpoint(options, function(err, status) {
            resolve(status);
        });
    })
}

module.exports = {
    setTemperatureThermostat,
};