/**
 * @description Shutdown Gladys instance.
 * @example
 * shutdown();
 */
async function shutdown() {
  // gracefully shutdown db
  await this.sequelize.close();
  // exit
  process.exit();
}

module.exports = {
  shutdown,
};
