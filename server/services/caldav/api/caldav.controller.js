module.exports = function CalDAVController(caldavHandler) {
    /**
     * @api {get} /api/v1/service/caldav/sync Start caldav sync for a user
     * @apiName Sync
     * @apiGroup CalDAV
     */
    async function sync(req, res) {
      const bridges = await caldavHandler.sync('fc055c6b-4fb3-4127-820c-a05c45f72084');
      res.json(bridges);
    }
  
    return {
      'get /api/v1/service/caldav/sync': {
        authenticated: true,
        controller: sync,
      },
    };
  };
  