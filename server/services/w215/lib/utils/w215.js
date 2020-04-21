'use strict';
const logger = require('../../../../utils/logger');
const requireUncached = require('require-uncached');

var w215 = function (add_IP, PIN_Code) {

    this.dsp = requireUncached('hnap/js/soapclient');
    this.url = "http://" + add_IP + "/HNAP1";
    this.username = 'admin';
    this.password = PIN_Code;

};

w215.prototype.login = function(callback) {
    this.dsp.login(this.username, this.password, this.url).done(callback);
};

w215.prototype.getPowerState = function(callback) {
        this.getState(function(settings){
                return callback(settings.power);
        });
};

w215.prototype.setPowerState = function(state, callback) {
    var self = this;
    var ip = this.url;
    var username = this.username;
    var password = this.password;

    self.login(function(loginStatus) {
        if (!loginStatus) {
            logger.debug(`w215 login error : ${username} / ${ip} / ${ password}, connection status = ${loginStatus}`);
            return;
        }
        else {
            logger.debug(`w215 connection status : ${loginStatus} (IP Adress : ${ip})`);
            //Récupération de l'état du device avant de changer son état
            self.getPowerState(function(deviceON){
                    // N'allume la prise que si elle est éteinte sinon ne l'éteint que si elle est allumée
                    if (state == 1 && !deviceON) {
                            self.dsp.on().done(function(res) {
                                    if (res == "ERROR") {
                                        logger.debug(`w215 stateON error : ${state == 'true' ? 'ON' : 'OFF'} / res = ${res}`);    
                                        callback(null, res);
                                    } else {
                                        logger.debug(`w215 stateON change to : ${state == 'true' ? 'ON' : 'OFF'} / res = ${res}`);
                                        callback(null, false);
                                    }
                            });
                    } else if (state == 0 && deviceON) {
                            self.dsp.off().done(function(res) {
                                    if (res == "ERROR") {
                                        logger.debug(`w215 stateOFF error : ${state == 'true' ? 'ON' : 'OFF'} / res = ${res}`);
                                        callback(null, res);
                                    } else {
                                        logger.debug(`w215 stateOFF change to : ${state == 'true' ? 'ON' : 'OFF'} / res = ${res}`);
                                        callback(null, false);
                                    }
                            });
                    } else { /* synchro gladys / device KO, nothing to do */ }
            });
        }
    });
};

w215.prototype.getState = function(callback) {
    var self = this;
    this.retries = 0;
    this.dsp.state().done(function(state) {
        self.dsp.totalConsumption().done(function(totalConsumption) {
            self.dsp.consumption().done(function(consumption) {
                self.dsp.temperature().done(function(temperature) {
                    var settings = {
                        power: state == 'true',
                        consumption: parseInt(consumption),
                        totalConsumption: parseFloat(totalConsumption),
                        temperature: parseFloat(temperature)
                    }
                    return callback(settings);
                });
            });
        });
    });
};

module.exports = w215;