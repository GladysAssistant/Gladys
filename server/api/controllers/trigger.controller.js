const asyncMiddleware = require('../middlewares/asyncMiddleware');

/**
 * @apiDefine TriggerParam
 * @apiParamExample {json} Request-Example:
 * {
 *   "name": "New trigger",
 *   "type": "light.turned-on",
 *   "rule": {
 *     "conditions": [{
 *        "type": "house.is-armed",
 *        "house": "my-house",
 *      }]
 *    }
 *  }
 */

module.exports = function TriggerController(gladys) {
  /**
   * @api {post} /api/v1/trigger create
   * @apiName create
   * @apiGroup Trigger
   * @apiUse TriggerParam
   */
  async function create(req, res) {
    const newTrigger = await gladys.trigger.create(req.body);
    res.status(201).json(newTrigger);
  }

  /**
   * @api {patch} /api/v1/trigger/:trigger_selector update
   * @apiName update
   * @apiGroup Trigger
   * @apiUse TriggerParam
   */
  async function update(req, res) {
    const newTrigger = await gladys.trigger.update(req.params.trigger_selector, req.body);
    res.json(newTrigger);
  }

  /**
   * @api {get} /api/v1/trigger get
   * @apiName get
   * @apiGroup Trigger
   *
   */
  async function get(req, res) {
    const triggers = await gladys.trigger.get(req.query);
    res.json(triggers);
  }

  /**
   * @api {delete} /api/v1/trigger/:trigger_selector delete
   * @apiName delete
   * @apiGroup Trigger
   *
   */
  async function destroy(req, res) {
    await gladys.trigger.destroy(req.params.trigger_selector);
    res.json({
      success: true,
    });
  }

  return Object.freeze({
    create: asyncMiddleware(create),
    destroy: asyncMiddleware(destroy),
    get: asyncMiddleware(get),
    update: asyncMiddleware(update),
  });
};
