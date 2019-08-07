module.exports = function CalDAVController(caldavHandler) {
  /**
   * @api {get} /api/v1/service/caldav/config Check config
   * @apiName Config
   * @apiGroup CalDAV
   */
  async function config(req, res) {
    const configuration = await caldavHandler.config(req.user.id);
    res.json(configuration);
  }

  /**
   * @api {get} /api/v1/service/caldav/sync Start caldav sync for a user
   * @apiName Sync
   * @apiGroup CalDAV
   */
  async function sync(req, res) {
    const events = await caldavHandler.sync(req.user.id);
    res.json(events);
  }

  return {
    'get /api/v1/service/caldav/config': {
      authenticated: true,
      controller: config,
    },
    'get /api/v1/service/caldav/sync': {
      authenticated: true,
      controller: sync,
    },
  };
};
