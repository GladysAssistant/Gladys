
/**
 * @apiDefine RoomSuccess
 * @apiSuccess {String} name The Name of the room
 * @apiSuccess {Integer} house House ID
 * @apiSuccess {Integer} permission Permission
 */

/**
 * @apiDefine RoomParam
 * @apiParam {String} name The Name of the room
 * @apiParam {Integer} house House ID
 * @apiParam {Integer} [permission] Permission
 */

module.exports = {
    
    /**
     * @api {get} /room get rooms
     * @apiName getRooms
     * @apiGroup Room
     * @apiPermission authenticated
     * 
     * @apiParam {integer} take number of rooms to return
     * @apiParam {integer} skip number of rooms to skip
     *
     * @apiUse RoomSuccess
     */
    index: function(req, res, next){
        gladys.room.get(req.query)
          .then(function(rooms){
              return res.json(rooms);
          })
          .catch(next);
    },
    
    /**
     * @api {post} /room create room
     * @apiName createRoom
     * @apiGroup Room
     * @apiPermission authenticated
     * 
     * @apiUse RoomParam
     *
     * @apiUse RoomSuccess
     */
    create: function(req, res, next){
        gladys.room.create(req.body)
          .then(function(room){
              return res.status(201).json(room);
          })
          .catch(next);
    },
    
    /**
     * @api {patch} /room/:id update room
     * @apiName updateRoom
     * @apiGroup Room
     * @apiPermission authenticated
     * 
     * @apiUse RoomParam
     *
     * @apiUse RoomSuccess
     */
    update: function(req, res, next){
        
        req.body.id = req.params.id;
        gladys.room.update(req.body)
          .then(function(room){
              return res.json(room);
          })
          .catch(next);
    },
    
    /**
     * @api {delete} /room/:id delete room
     * @apiName deleteRoom
     * @apiGroup Room
     * @apiPermission authenticated
     */
    delete: function(req, res, next){
        gladys.room.delete({id: req.params.id})
          .then(function(room){
              return res.json(room);
          })
          .catch(next);
    }
};

