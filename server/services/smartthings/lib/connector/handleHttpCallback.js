/**
 * @description Use with a standard HTTP webhook endpoint app. Signature verification is required.
 * @param {*} req - Incoming request.
 * @param {*} res - Response to fill.
 * @example
 * await smartthingsHandler.handleHttpCallback(req, res);
 */
async function handleHttpCallback(req, res) {
  await this.connector.handleHttpCallback(req, res);
}

module.exports = {
  handleHttpCallback,
};
