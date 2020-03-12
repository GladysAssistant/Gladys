module.exports = function CalDAVController(caldavHandler) {
  /**
   * @api {get} /api/v1/service/caldav/config Check config
   * @apiName Config
   * @apiGroup CalDAV
   */
  async function config(req, res) {
    try {
      await caldavHandler.config(req.user.id);
      await caldavHandler.cleanUp(req.user.id);
      res.status(200).send();
    } catch (error) {
      res.status(500).send({ error: error.toString() });
    }
  }

  /**
   * @api {get} /api/v1/service/caldav/cleanup Clear users CalDAV's calendars
   * @apiName CleanUp
   * @apiGroup CalDAV
   */
  async function cleanup(req, res) {
    try {
      await caldavHandler.cleanUp(req.user.id);
      res.status(200).send();
    } catch (error) {
      res.status(500).send();
    }
  }

  /**
   * @api {get} /api/v1/service/caldav/sync Start caldav sync for a user
   * @apiName Sync
   * @apiGroup CalDAV
   */
  async function sync(req, res) {
    try {
      await caldavHandler.syncUserCalendars(req.user.id);
      res.status(200).send();
    } catch (error) {
      res.status(500).send({ error: error.toString() });
    }
  }

  return {
    'get /api/v1/service/caldav/config': {
      authenticated: true,
      controller: config,
    },
    'get /api/v1/service/caldav/cleanup': {
      authenticated: true,
      controller: cleanup,
    },
    'get /api/v1/service/caldav/sync': {
      authenticated: true,
      controller: sync,
    },
  };
};
