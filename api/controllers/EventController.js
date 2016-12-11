
/**
 * @apiDefine EventSuccess
 * @apiSuccess {Integer} id Event id
 * @apiSuccess {Integer} user  User id
 * @apiSuccess {Integer} house  House id 
 * @apiSuccess {Integer} room  Room id
 * @apiSuccess {Integer} eventtype  Event Type id
 * @apiSuccess {String} code  Event code
 * @apiSuccess {String} name  Event name
 * @apiSuccess {String} description  Event description
 */

/**
 * @apiDefine EventParam
 * @apiParam {String} code Event code you want to create
 * @apiParam {Integer} [user] id of the user concerned by the event (only for user-related event)
 * @apiParam {Integer} [house] id of the house where the events take place
 * @apiParam {Integer} [room] id of the room where the events take place
 * @apiParam {Datetime} [datetime] If you want to specify a specific datetime when the event took place
 */

module.exports = {
    
    /**
     * @api {get} /event get all events
     * @apiName GetEvents
     * @apiGroup Event
     * @apiPermission authenticated
     *
     * @apiParam {Integer} [take] Number of events to return
     * @apiParam {Integer} [skip] Where to start (for pagination)
     *
     * @apiUse EventSuccess
     */
    index: function(req, res, next){
        req.query.user = req.session.User;
        gladys.event.get(req.query)
          .then(function(events){
              return res.json(events);
          })
          .catch(next);
    },
    
     /**
     * @api {post} /event create event
     * @apiName CreateEvent
     * @apiGroup Event
     * @apiPermission authenticated
     * 
     * @apiUse EventParam
     *
     * @apiUse EventSuccess
     */
    create: function(req, res, next){
        gladys.event.create(req.body)
          .then((event) => res.status(201).json(event))
          .catch(next);
    },

    /**
     * @api {get} /event/create create event (GET)
     * @apiName CreateEventGet
     * @apiGroup Event
     * @apiPermission authenticated
     * 
     * @apiUse EventParam
     *
     * @apiUse EventSuccess
     */
    createGet: function(req, res, next){
        gladys.event.create(req.query)
          .then((event) => res.status(201).json(event))
          .catch(next);
    }
	
};

