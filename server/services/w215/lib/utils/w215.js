const requireUncached = require('require-uncached');
const logger = require('../../../../utils/logger');

const W215 = function (addIP, PINCode) {

    this.dsp = requireUncached('hnap/js/soapclient');
    this.url = `http://${addIP}/HNAP1`;
    this.username = 'admin';
    this.password = PINCode;

};

W215.prototype.login = function(callback) {
    this.dsp.login(this.username, this.password, this.url).done(callback);
};

W215.prototype.getPowerState = function(callback) {
    this.getState(function(settings){
            return callback(settings.power);
    });
};

W215.prototype.setPowerState = function setPowerState(state, callback) {
    const self = this;
    const ip = this.url;
    const username = this.username;
    const password = this.password;

    self.login(function(loginStatus) {
        if (!loginStatus) {
            logger.debug(`w215 login error : ${username} / ${ip} / ${ password}, connection status = ${loginStatus}`);
        } else {
            logger.debug(`w215 connection status : ${loginStatus} (IP Adress : ${ip})`);
            // Récupération de l'état du device avant de changer son état
            self.getPowerState(function(deviceON){
                // N'allume la prise que si elle est éteinte sinon ne l'éteint que si elle est allumée
                if (state === 1 && !deviceON) {
                        self.dsp.on().done(function(res) {
                            if (res === 'ERROR') {
                                logger.debug(`w215 stateON error : ${state === 1 ? 'ON' : 'OFF'} / res = ${res}`);    
                                callback(null, res);
                            } else {
                                logger.debug(`w215 stateON change to : ${state === 1 ? 'ON' : 'OFF'} / res = ${res}`);
                                callback(null, true);
                            }
                        });
                } else if (state === 0 && deviceON) {
                        self.dsp.off().done(function(res) {
                            if (res === 'ERROR') {
                                logger.debug(`w215 stateOFF error : ${state === 1 ? 'ON' : 'OFF'} / res = ${res}`);
                                callback(null, res);
                            } else {
                                logger.debug(`w215 stateOFF change to : ${state === 1 ? 'ON' : 'OFF'} / res = ${res}`);
                                callback(null, false);
                            }
                        });
                } else { /* synchro gladys / device KO, nothing to do */ }
            });
        }
    });
};

W215.prototype.getState = function(callback) {
    const self = this;
    this.dsp.state().done(function(state) {
        self.dsp.totalConsumption().done(function(totalConsumption) {
            self.dsp.consumption().done(function(consumption) {
                self.dsp.temperature().done(function(temperature) {
                    const settings = {
                        power: state === 'true',
                        consumption: parseInt(consumption, 10),
                        totalConsumption: parseFloat(totalConsumption),
                        temperature: parseFloat(temperature)
                    };
                    return callback(settings);
                });
            });
        });
    });
};

module.exports = W215;