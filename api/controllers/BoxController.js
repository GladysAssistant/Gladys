/**
* @apiDefine BoxSuccess
* @apiSuccess {Integer} id id of the box
* @apiSuccess {Integer} boxtype The Box Type id
* @apiSuccess {Integer} x the position of the box in X
* @apiSuccess {Integer} y the position of the box in X
* @apiSuccess {Integer} user user id
* @apiSuccess {json} params params of the box
* @apiSuccess {boolean} active if the box is active or not
*/
   
module.exports = {
    
    
     /**
     * @api {get} /box get Box
     * @apiName getBox
     * @apiGroup Box
     * @apiPermission authenticated
     * 
     * @apiUse BoxSuccess
     */
    index: function(req, res, next){
       gladys.box.getBoxUser({user: req.session.User})
        .then((boxs) => {
             
            // translate box title
            boxs.forEach((box) => {
                box.boxType.title = req.__(`box-${box.boxType.title}-title`);
            });
            
            return res.json(boxs);
        })  
        .catch(next); 
    },

    /**
     * @api {get} /box/:id get Box ById
     * @apiName getBoxById
     * @apiGroup Box
     * @apiPermission authenticated
     * 
     * @apiUse BoxSuccess
     */
    getById: function(req, res, next){
        gladys.box.getById(req.params.id)
            .then((box) => res.json(box))
            .catch(next);
    },
    
     /**
     * @api {post} /box create Box
     * @apiName createBox
     * @apiGroup Box
     * @apiPermission authenticated
     * 
     * @apiUse BoxSuccess
     */
    create: function(req, res, next){
      req.body.user = req.session.User.id;
      gladys.box.create(req.body)
        .then((box) => res.json(box))  
        .catch(next);
    },
    
     /**
     * @api {patch} /box/:id patch Box
     * @apiName patchBox
     * @apiGroup Box
     * @apiPermission authenticated
     * 
     * @apiUse BoxSuccess
     */
    update: function(req, res, next){
        req.body.id = req.params.id;
        gladys.box.update(req.body)
          .then((box) => res.json(box))
          .catch(next);
    },

     /**
     * @api {delete} /box/:id delete box
     * @apiName deleteBox
     * @apiGroup Box
     * @apiPermission authenticated
     * 
     * @apiUse BoxSuccess
     */
    delete: function(req, res, next){
        gladys.box.delete({id: req.params.id})
          .then((box) => res.json(box))
          .catch(next);
    }
	
};
