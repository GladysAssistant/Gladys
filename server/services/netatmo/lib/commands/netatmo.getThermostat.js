/**
 * @description Connect.
 * @example
 * netatmo.getThermostat();
 */
function getThermostat() {
    return new Promise(resolve => {
        const response = this.api.getThermostatsData(function(err, devices) {
            resolve(devices)
        });
    })
}

module.exports = {
    getThermostat,
};