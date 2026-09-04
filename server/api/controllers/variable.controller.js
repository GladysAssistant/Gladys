const asyncMiddleware = require('../middlewares/asyncMiddleware');
const { NotFoundError, ForbiddenError } = require('../../utils/coreErrors');
const { USER_ROLE } = require('../../utils/constants');

/**
 * @description Ensure only an admin can reach a service-wide variable.
 * Service variables that are not scoped to a user hold the credentials of the
 * integrations (API keys, broker passwords, OAuth tokens), so reading or
 * writing them is an administration gesture. Variables scoped to the calling
 * user are left alone: a user can only ever touch their own row.
 * @param {object} req - The Express request.
 * @param {string} [userId] - The user the variable is scoped to, or null when it is service-wide.
 * @returns {void}
 * @example
 * ensureAdminOnServiceWideVariable(req, null);
 */
function ensureAdminOnServiceWideVariable(req, userId) {
  if (userId) {
    return;
  }
  if (!req.user || req.user.role !== USER_ROLE.ADMIN) {
    throw new ForbiddenError('This route is only accessible to admin user.');
  }
}

module.exports = function VariableController(gladys) {
  /**
   * @api {post} /api/service/:service_name/variable/:variable_key Save service variable
   * @apiName SaveVariable
   * @apiGroup Variable
   * @apiParam {string} value value to save
   */
  async function setForLocalService(req, res) {
    const userId = req.body.userRelated ? req.user.id : null;
    ensureAdminOnServiceWideVariable(req, userId);
    const service = await gladys.service.getLocalServiceByName(req.params.service_name);
    const variable = await gladys.variable.setValue(req.params.variable_key, req.body.value, service.id, userId);
    res.json(variable);
  }

  /**
   * @api {get} /api/service/:service_name/variable/:variable_key Get service variable
   * @apiName GetVariableByService
   * @apiGroup Variable
   */
  async function getByLocalService(req, res) {
    const userId = req.query.userRelated ? req.user.id : null;
    ensureAdminOnServiceWideVariable(req, userId);
    const service = await gladys.service.getLocalServiceByName(req.params.service_name);
    const value = await gladys.variable.getValue(req.params.variable_key, service.id, userId);
    if (!value) {
      throw new NotFoundError('VARIABLE_NOT_FOUND');
    }
    res.json({
      value,
    });
  }

  /**
   * @api {post} /api/variable/:variable_key Save variable
   * @apiName SaveVariable
   * @apiGroup Variable
   * @apiParam {string} value value to save
   */
  async function setValue(req, res) {
    const variable = await gladys.variable.setValue(req.params.variable_key, req.body.value);
    res.json(variable);
  }

  /**
   * @api {post} /api/user/variable/:variable_key Save user variable
   * @apiName SaveUserVariable
   * @apiGroup Variable
   * @apiParam {string} value value to save
   */
  async function setForUser(req, res) {
    const variable = await gladys.variable.setValue(req.params.variable_key, req.body.value, null, req.user.id);
    res.json(variable);
  }

  /**
   * @api {get} /api/user/variable/:variable_key Get user variable
   * @apiName GetUserVariable
   * @apiGroup Variable
   */
  async function getForUser(req, res) {
    const value = await gladys.variable.getValue(req.params.variable_key, null, req.user.id);
    if (!value) {
      throw new NotFoundError('VARIABLE_NOT_FOUND');
    }
    res.json({ value });
  }

  /**
   * @api {get} /api/variable/:variable_key Get variable
   * @apiName getVariable
   * @apiGroup Variable
   * @apiParam {string} value value to save
   */
  async function getValue(req, res) {
    const value = await gladys.variable.getValue(req.params.variable_key);
    if (!value) {
      throw new NotFoundError('VARIABLE_NOT_FOUND');
    }
    res.json({ value });
  }

  return Object.freeze({
    setForLocalService: asyncMiddleware(setForLocalService),
    setValue: asyncMiddleware(setValue),
    getValue: asyncMiddleware(getValue),
    getByLocalService: asyncMiddleware(getByLocalService),
    setForUser: asyncMiddleware(setForUser),
    getForUser: asyncMiddleware(getForUser),
  });
};
