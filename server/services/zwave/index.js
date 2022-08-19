
module.exports = function ZwaveService(gladys, serviceId) {


  /**
   * @public
   * @description This function starts the service
   * @example
   * gladys.services.zwave.start();
   */
  async function start() {
  }

  /**
   * @public
   * @description This function stops the service
   * @example
   * gladys.services.zwave.stop();
   */
  async function stop() {
  }

  return Object.freeze({
    start,
    stop,
    device: null,
    controllers: null,
  });
};