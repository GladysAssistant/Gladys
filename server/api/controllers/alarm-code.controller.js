const asyncMiddleware = require('../middlewares/asyncMiddleware');

/**
 * @description Alarm code REST controller.
 * @param {object} gladys - Gladys service container.
 * @returns {object} Controller with the alarm code handlers.
 */
module.exports = function AlarmCodeController(gladys) {
  /**
   * @api {get} /api/v1/alarm_code Get alarm codes
   * @apiName get
   * @apiGroup AlarmCode
   * @apiDescription List every alarm code with its holder. Admin only, and hashes are never
   * returned: no code can be read back, not even by an admin.
   * @param {object} req - Express request.
   * @param {object} res - Express response.
   * @returns {Promise<void>} Nothing.
   */
  async function get(req, res) {
    const codes = await gladys.alarmCode.get();
    res.json(codes);
  }

  /**
   * @api {post} /api/v1/alarm_code Create a guest alarm code
   * @apiName createGuest
   * @apiGroup AlarmCode
   * @apiDescription Create a code for somebody who has no Gladys account, optionally with an
   * expiry date. Admin only.
   * @apiParam {String} name Name of the guest.
   * @apiParam {String} code The code, 4 to 8 digits.
   * @apiParam {String} [valid_until] Date after which the code stops working.
   * @param {object} req - Express request.
   * @param {object} res - Express response.
   * @returns {Promise<void>} Nothing.
   */
  async function createGuest(req, res) {
    const code = await gladys.alarmCode.createGuest(req.user.id, req.body);
    res.status(201).json(code);
  }

  /**
   * @api {delete} /api/v1/alarm_code/:alarm_code_id Revoke an alarm code
   * @apiName destroy
   * @apiGroup AlarmCode
   * @apiDescription Revoke a code, personal or guest. Admin only.
   * @param {object} req - Express request.
   * @param {object} res - Express response.
   * @returns {Promise<void>} Nothing.
   */
  async function destroy(req, res) {
    await gladys.alarmCode.destroy(req.params.alarm_code_id);
    res.json({ success: true });
  }

  /**
   * @api {get} /api/v1/me/alarm_code Is my alarm code set
   * @apiName getMine
   * @apiGroup AlarmCode
   * @apiDescription Tell whether the current user has a code. The code itself is never returned.
   * @param {object} req - Express request.
   * @param {object} res - Express response.
   * @returns {Promise<void>} Nothing.
   */
  async function getMine(req, res) {
    const defined = await gladys.alarmCode.existsForUser(req.user.id);
    res.json({ defined });
  }

  /**
   * @api {patch} /api/v1/me/alarm_code Set my alarm code
   * @apiName setMine
   * @apiGroup AlarmCode
   * @apiDescription Set or replace the code of the current user. Nobody else can set it.
   * @apiParam {String} code The code, 4 to 8 digits.
   * @param {object} req - Express request.
   * @param {object} res - Express response.
   * @returns {Promise<void>} Nothing.
   */
  async function setMine(req, res) {
    const code = await gladys.alarmCode.setForUser(req.user.id, req.body.code);
    res.json(code);
  }

  /**
   * @api {delete} /api/v1/me/alarm_code Delete my alarm code
   * @apiName destroyMine
   * @apiGroup AlarmCode
   * @apiDescription Delete the code of the current user.
   * @param {object} req - Express request.
   * @param {object} res - Express response.
   * @returns {Promise<void>} Nothing.
   */
  async function destroyMine(req, res) {
    await gladys.alarmCode.destroyForUser(req.user.id);
    res.json({ success: true });
  }

  return Object.freeze({
    get: asyncMiddleware(get),
    createGuest: asyncMiddleware(createGuest),
    destroy: asyncMiddleware(destroy),
    getMine: asyncMiddleware(getMine),
    setMine: asyncMiddleware(setMine),
    destroyMine: asyncMiddleware(destroyMine),
  });
};
