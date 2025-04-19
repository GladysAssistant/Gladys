/**
 * @description This will stop the Matter service.
 * @example matter.stop();
 */
async function stop() {
  if (this.commissioningController) {
    await this.commissioningController.close();
  }
}

module.exports = {
  stop,
};
