/**
 * @description This will stop the Matter service.
 * @example matter.stop();
 */
async function stop() {
  await this.commissioningController.close();
}

module.exports = {
  stop,
};
