/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */
  
/**
 * @apiDefine LocationSuccess
 * @apiSuccess {datetime} datetime Datetime of the location
 * @apiSuccess {float} latitude Latitude
 * @apiSuccess {float} longitude  Longitude
 * @apiSuccess {float} altitude  Altitude
 * @apiSuccess {float} accuracy  Accuracy in meters
 * @apiSuccess {integer} user  User ID
 */

/**
 * @apiDefine LocationParam
 * @apiParam {datetime} [datetime] Datetime of the location
 * @apiParam {float} latitude Latitude
 * @apiParam {float} longitude  Longitude
 * @apiParam {float} [altitude]  Altitude
 * @apiParam {float} [accuracy]  Accuracy in meters
 */

module.exports = {

	/**
     * @api {post} /location create location
     * @apiName createLocation
     * @apiGroup Location
     * @apiPermission authenticated
     *
     * @apiUse LocationParam
     * 
     * @apiUse LocationSuccess
     */
	create : function(req,res, next){
        
        var location;
        
        // request can be a get or post request
        if(req.query.latitude) {
            location = req.query;
        } else {
            location = req.body;
        }
        
        location.user = req.session.User.id;

        gladys.location.create(location)
          .then(function(location){
              return res.status(201).json(location);
          })
          .catch(next);
	},

    get: function(req, res, next){
        gladys.location.get()
            .then(locations => res.json(locations))
            .catch(next);
    },

    getByUser: function(req, res, next){
        gladys.location.getByUser({user: req.params.id, take: req.query.take, skip: req.query.skip})
            .then(locations => res.json(locations))
            .catch(next);
    }

};

