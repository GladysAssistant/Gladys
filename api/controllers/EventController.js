/**
 * EventController
 *
 * @description :: Server-side logic for managing events
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {
    
    /**
     * @api {get} /event GET
     * @apiName GetEvents
     * @apiGroup Event
     * @apiPermission authenticated
     *
     * @apiParam {Integer} [take] Number of events to return
     * @apiParam {Integer} [skip] Where to start (for pagination)
     *
     * @apiSuccess {Integer} id Event id
     * @apiSuccess {Integer} user  User id
     * @apiSuccess {Integer} house  House id 
     * @apiSuccess {Integer} room  Room id
     * @apiSuccess {Integer} eventtype  Event Type id
     * @apiSuccess {String} code  Event code
     * @apiSuccess {String} name  Event name
     * @apiSuccess {String} description  Event description
     * 
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
     * @api {post} /event POST
     * @apiName CreateEvent
     * @apiGroup Event
     * @apiPermission authenticated
     *
     * @apiParam {String} code Event code you want to create
     * @apiParam {Integer} [user] id of the user concerned by the event (only for user-related event)
     * @apiParam {Integer} [house] id of the house where the events take place
     * @apiParam {Integer} [room] id of the room where the events take place
     * @apiParam {Datetime} [datetime] If you want to specify a specific datetime when the event took place
     *
     * @apiSuccess {Integer} id Event id
     * @apiSuccess {Integer} user  User id
     * @apiSuccess {Integer} house  House id 
     * @apiSuccess {Integer} room  Room id
     * @apiSuccess {Integer} eventtype  Event Type id
     * @apiSuccess {String} code  Event code
     * @apiSuccess {String} name  Event name
     * @apiSuccess {String} description  Event description
     * 
     */
    create: function(req, res, next){
        
        // get or post request are allowed
        var obj;
        if(req.body && req.body.code){
            obj = req.body;
        } else {
            obj = req.query;
        }
        gladys.event.create(obj)
          .then(function(event){
              return res.status(201).json(event);
          })
          .catch(next);
    },
    
    update: function(req, res, next){
        
    },
    
    delete: function(req, res, next){
        
    }
	
};

