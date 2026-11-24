/**
 * @description This will stop the Matter service.
 * @example matter.stop();
 */
async function stop() {
  if (this.commissioningController) {
    // the nodes are closed with the controller: their status is not followed anymore, their last
    // contact is kept
    await this.saveLastContacts();
    this.unwatchNode();
    this.clearNodeStatuses();
    await this.commissioningController.close();
  }
}

module.exports = {
  stop,
};
