const asyncMiddleware = require('../middlewares/asyncMiddleware');

/**
 * @apiDefine DashboardParam
 * @apiParam {String} name Name of the dashboard.
 * @apiParam {String} [selector] Selector of the dashboard.
 * @apiParam {String} [type] Type of the dashboard.
 * @apiParam {Array} [boxes] Array of boxes in the dashboard.
 */

/**
 * @apiDefine DashboardSuccess
 * @apiSuccess {String} name Name of the dashboard.
 * @apiSuccess {String} [selector] Selector of the dashboard.
 * @apiSuccess {String} [type] Type of the dashboard.
 * @apiSuccess {Array} [boxes] Array of boxes in the dashboard.
 */

module.exports = function DashboardController(gladys) {
  /**
   * @api {post} /api/v1/dashboard create
   * @apiName createDashoard
   * @apiGroup Dashboard
   * @apiUse DashboardParam
   * @apiUse DashboardSuccess
   */
  async function create(req, res) {
    const dashboard = await gladys.dashboard.create(req.user.id, req.body);
    res.status(201).json(dashboard);
  }

  /**
   * @api {get} /api/v1/dashboard get
   * @apiName get
   * @apiGroup Dashboard
   */
  async function get(req, res) {
    const dashboards = await gladys.dashboard.get(req.user.id);
    res.json(dashboards);
  }

  /**
   * @api {patch} /api/v1/dashboard/:dashboard_selector update
   * @apiName update
   * @apiGroup Dashboard
   * @apiUse DashboardParam
   * @apiUse DashboardSuccess
   */
  async function update(req, res) {
    const dashboard = await gladys.dashboard.update(req.user.id, req.params.dashboard_selector, req.body);
    res.json(dashboard);
  }

  /**
   * @api {post} /api/v1/dashboard/order updateOrder
   * @apiName updateOrder
   * @apiGroup Dashboard
   * @apiParam {Array} [selectors] Array of selectors in new order.
   */
  async function updateOrder(req, res) {
    await gladys.dashboard.updateOrder(req.user.id, req.body);
    res.json({ success: true });
  }

  /**
   * @api {get} /api/v1/dashboard/:dashboard_selector getBySelector
   * @apiName getBySelector
   * @apiGroup Dashboard
   * @apiUse DashboardSuccess
   */
  async function getBySelector(req, res) {
    const dashboard = await gladys.dashboard.getBySelector(req.user.id, req.params.dashboard_selector);
    res.json(dashboard);
  }

  /**
   * @api {delete} /api/v1/dashboard/:dashboard_selector delete
   * @apiName delete
   * @apiGroup Dashboard
   */
  async function destroy(req, res) {
    await gladys.dashboard.destroy(req.user.id, req.params.dashboard_selector);
    res.json({
      success: true,
    });
  }

  return Object.freeze({
    create: asyncMiddleware(create),
    destroy: asyncMiddleware(destroy),
    get: asyncMiddleware(get),
    getBySelector: asyncMiddleware(getBySelector),
    update: asyncMiddleware(update),
    updateOrder: asyncMiddleware(updateOrder),
  });
};
