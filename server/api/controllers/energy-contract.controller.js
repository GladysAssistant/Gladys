const asyncMiddleware = require('../middlewares/asyncMiddleware');

/**
 * @description Energy contract REST controller (docs/specs/energy-contracts.md, section 8.1).
 * @param {object} gladys - Gladys service container.
 * @returns {object} Controller handlers.
 * @example
 * EnergyContractController(gladys);
 */
module.exports = function EnergyContractController(gladys) {
  /**
   * @api {get} /api/v1/energy_contract get
   * @apiName get
   * @apiGroup EnergyContract
   * @apiParam {string} [electric_meter_device_id] Filter on a root meter.
   */
  async function get(req, res) {
    const contracts = await gladys.energyContract.get(req.query || {});
    res.json(contracts);
  }

  /**
   * @api {post} /api/v1/energy_contract create
   * @apiName create
   * @apiGroup EnergyContract
   * @apiDescription 400 on an invalid tariff (JSON path in the message), 409 on a date overlap.
   */
  async function create(req, res) {
    const contract = await gladys.energyContract.create(req.body);
    res.status(201).json(contract);
  }

  /**
   * @api {patch} /api/v1/energy_contract/:selector update
   * @apiName update
   * @apiGroup EnergyContract
   */
  async function update(req, res) {
    const contract = await gladys.energyContract.update(req.params.selector, req.body);
    res.json(contract);
  }

  /**
   * @api {delete} /api/v1/energy_contract/:selector destroy
   * @apiName destroy
   * @apiGroup EnergyContract
   */
  async function destroy(req, res) {
    await gladys.energyContract.destroy(req.params.selector);
    res.json({ success: true });
  }

  /**
   * @api {post} /api/v1/energy_contract/preview preview
   * @apiName preview
   * @apiGroup EnergyContract
   * @apiDescription Price the real intervals of a meter over a window without writing anything.
   */
  async function preview(req, res) {
    const result = await gladys.energyContract.preview(req.body);
    res.json(result);
  }

  /**
   * @api {post} /api/v1/energy_contract/recalculate recalculate
   * @apiName recalculate
   * @apiGroup EnergyContract
   * @apiDescription Recompute the costs of every meter carrying a contract from a date.
   */
  async function recalculate(req, res) {
    const result = await gladys.energyContract.recalculate(req.body.from);
    res.json({ success: true, ...result });
  }

  /**
   * @api {get} /api/v1/energy_contract/template getTemplates
   * @apiName getTemplates
   * @apiGroup EnergyContract
   */
  async function getTemplates(req, res) {
    const templates = await gladys.energyContract.getTemplates();
    res.json(templates);
  }

  /**
   * @api {get} /api/v1/energy_contract/template/:provider/:key getTemplate
   * @apiName getTemplate
   * @apiGroup EnergyContract
   * @apiParam {string} [variant] The subscribed power of a v1 catalogue template.
   * @apiParam {string} [service_id] The integration providing the template.
   */
  async function getTemplate(req, res) {
    const template = await gladys.energyContract.getTemplate(req.params.provider, req.params.key, req.query || {});
    res.json(template);
  }

  /**
   * @api {get} /api/v1/energy_contract/:selector/current getCurrent
   * @apiName getCurrent
   * @apiGroup EnergyContract
   */
  async function getCurrent(req, res) {
    const current = await gladys.energyContract.getCurrent(req.params.selector);
    res.json(current);
  }

  /**
   * @api {get} /api/v1/energy_contract/:selector getBySelector
   * @apiName getBySelector
   * @apiGroup EnergyContract
   */
  async function getBySelector(req, res) {
    const contract = await gladys.energyContract.getBySelector(req.params.selector);
    res.json(contract);
  }

  /**
   * @api {get} /api/v1/energy_calendar getCalendars
   * @apiName getCalendars
   * @apiGroup EnergyContract
   */
  async function getCalendars(req, res) {
    const calendars = await gladys.energyContract.getCalendars();
    res.json(calendars);
  }

  /**
   * @api {get} /api/v1/energy_calendar/:key getCalendarEntries
   * @apiName getCalendarEntries
   * @apiGroup EnergyContract
   * @apiParam {string} [from] Window start.
   * @apiParam {string} [to] Window end.
   * @apiParam {number} [limit] Last N entries when no window is given.
   */
  async function getCalendarEntries(req, res) {
    const options = {};
    if (req.query.from) {
      options.from = req.query.from;
    }
    if (req.query.to) {
      options.to = req.query.to;
    }
    if (req.query.limit) {
      options.limit = Number(req.query.limit);
    }
    const entries = await gladys.energyContract.getCalendarEntries(req.params.key, options);
    res.json(entries);
  }

  return Object.freeze({
    get: asyncMiddleware(get),
    create: asyncMiddleware(create),
    update: asyncMiddleware(update),
    destroy: asyncMiddleware(destroy),
    preview: asyncMiddleware(preview),
    recalculate: asyncMiddleware(recalculate),
    getTemplates: asyncMiddleware(getTemplates),
    getTemplate: asyncMiddleware(getTemplate),
    getCurrent: asyncMiddleware(getCurrent),
    getBySelector: asyncMiddleware(getBySelector),
    getCalendars: asyncMiddleware(getCalendars),
    getCalendarEntries: asyncMiddleware(getCalendarEntries),
  });
};
