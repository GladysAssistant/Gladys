
/**
 * @apiDefine AreaSuccess
 * @apiSuccess {String} name Name of the area.
 * @apiSuccess {float} latitude Latitude
 * @apiSuccess {float} longitude Longitude
 * @apiSuccess {float} radius The radius of the area in meters
 * @apiSuccess {Integer} user The owner of the area 
 */

/**
 * @apiDefine AreaParam
 * @apiParam {String} name Name of the area.
 * @apiParam {float} latitude Latitude
 * @apiParam {float} longitude Longitude
 * @apiParam {float} radius The radius of the area in meters
 */

module.exports = {
  
  /**
   * @api {get} /area get all areas
   * @apiName getArea
   * @apiGroup Area
   * @apiPermission authenticated
   * 
   * @apiUse AreaSuccess
   */
  index: function(req, res, next){
      gladys.area.get(req.session.User)
        .then(function(areas){
            return res.json(areas);
        })
        .catch(next);
  },
  
  /**
   * @api {post} /area create an area
   * @apiName createArea
   * @apiGroup Area
   * @apiPermission authenticated
   * 
   * @apiUse AreaParam
   * 
   * @apiUse AreaSuccess
   */
  create: function(req, res, next){
      req.body.user = req.session.User.id;
      gladys.area.create(req.body)
        .then(function(area){
            return res.status(201).json(area);
        })
        .catch(next);
  },
  
  /**
   * @api {patch} /area/:id update an area
   * @apiName updateArea
   * @apiGroup Area
   * @apiPermission authenticated
   * 
   * @apiUse AreaParam
   * 
   * @apiUse AreaSuccess
   */
  update: function(req, res, next){
      req.body.id = req.params.id;
      gladys.area.update(req.body)
        .then(function(area){
            return res.json(area);
        })
        .catch(next);
  },
  
   /**
   * @api {delete} /area/:id delete an area
   * @apiName deleteArea
   * @apiGroup Area
   * @apiPermission authenticated
   *
   */
  delete: function(req, res, next){
      gladys.area.delete({id: req.params.id})
        .then(function(){
            return res.json({success: true});
        })
        .catch(next);
  }
    
};