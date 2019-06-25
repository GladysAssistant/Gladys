module.exports = function CalDAVController(caldavHandler) {
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
    'get /api/v1/service/caldav/sync': {
      authenticated: true,
      controller: sync,
    },
  };
};
