const asyncMiddleware = require('../middlewares/asyncMiddleware');
const { NotFoundError } = require('../../utils/coreErrors');

module.exports = function VariableController(gladys) {
  /**
   * @api {post} /api/service/:service_name/variable/:variable_key Save service variable
   * @apiName SaveVariable
   * @apiGroup Variable
   * @apiParam {string} value value to save
   */
  async function setForLocalService(req, res) {
    const userId = req.body.userRelated ? req.user.id : null;
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
  });
};
