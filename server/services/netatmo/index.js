const logger = require('../../utils/logger');
const NetatmoManager = require('./lib');
const NetatmoController = require('./api/netatmo.controller');

module.exports = function NetatmoService(gladys, serviceId) {
    const netatmoManager = new NetatmoManager(gladys, NetatmoController, serviceId);
    /**
     * @public
     * @description This function listen event on Netatmo service
     * @example
     * gladys.services.netatmo.start();
     */
    async function start() {
        logger.info('Starting Netatmo service');
        netatmoManager.connect();
    }

    /**
     * @public
     * @description This function stops the service
     * @example
     *  gladys.services.netatmo.stop();
     */
    async function stop() {
        logger.info('Stopping Netatmo service');
    }

    return Object.freeze({
        start,
        stop,
        controllers: NetatmoController(netatmoManager),
    });
};