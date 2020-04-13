const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');

module.exports = function CalDAVController(caldavHandler) {
  /**
   * @api {get} /api/v1/service/caldav/config Check config
   * @apiName Config
   * @apiGroup CalDAV
   */
  async function config(req, res) {
    await caldavHandler.config(req.user.id);
    await caldavHandler.cleanUp(req.user.id);
    res.json({
      success: true,
    });
  }

  /**
   * @api {get} /api/v1/service/caldav/cleanup Clear users CalDAV's calendars
   * @apiName CleanUp
   * @apiGroup CalDAV
   */
  async function cleanup(req, res) {
    await caldavHandler.cleanUp(req.user.id);
    res.json({
      success: true,
    });
  }

  /**
   * @api {get} /api/v1/service/caldav/sync Start caldav sync for a user
   * @apiName Sync
   * @apiGroup CalDAV
   */
  async function sync(req, res) {
    await caldavHandler.syncUserCalendars(req.user.id);
    res.json({
      success: true,
    });
  }

  return {
    'get /api/v1/service/caldav/config': {
      authenticated: true,
      controller: asyncMiddleware(config),
    },
    'get /api/v1/service/caldav/cleanup': {
      authenticated: true,
      controller: asyncMiddleware(cleanup),
    },
    'get /api/v1/service/caldav/sync': {
      authenticated: true,
      controller: asyncMiddleware(sync),
    },
  };
};
