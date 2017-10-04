/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */
  
/**
 * @apiDefine HouseSuccess
 * @apiSuccess {uuid} uuid House unique id
 * @apiSuccess {String} name  The name of the house
 * @apiSuccess {String} address  The address of the house
 * @apiSuccess {String} city  The city
 * @apiSuccess {integer} postcode  Postcode
 * @apiSuccess {String} country  Country
 * @apiSuccess {float} latitude  Latitude of the house
 * @apiSuccess {float} longitude  Longitude of the house
 */

/**
 * @apiDefine HouseParam
 * @apiParam {uuid} uuid House unique id
 * @apiParam {String} name  The name of the house
 * @apiParam {String} address  The address of the house
 * @apiParam {String} city  The city
 * @apiParam {integer} postcode  Postcode
 * @apiParam {String} country  Country
 * @apiParam {float} latitude  Latitude of the house
 * @apiParam {float} longitude  Longitude of the house
 */

module.exports = {
    
    /**
     * @api {get} /house get all houses
     * @apiName GetHouses
     * @apiGroup House
     * @apiPermission authenticated
     *
     * @apiUse HouseSuccess
     */
    index: function(req, res, next){
        gladys.house.get()
          .then(function(houses){
              return res.json(houses);
          })
          .catch(next);
    },
    
    /**
     * @api {post} /house create a house
     * @apiName createHouse
     * @apiGroup House
     * @apiPermission authenticated
     *
     * @apiUse HouseParam
     * 
     * @apiUse HouseSuccess
     */
    create: function(req, res, next){
        gladys.house.create(req.body)
          .then(function(house){
              return res.status(201).json(house);
          })
          .catch(next);
    },
    
     /**
     * @api {patch} /house/:id update a house
     * @apiName updateHouse
     * @apiGroup House
     * @apiPermission authenticated
     *
     * @apiUse HouseParam
     * 
     * @apiUse HouseSuccess
     */
    update: function(req, res, next){
        
        req.body.id = req.params.id;
        gladys.house.update(req.body)
          .then(function(house){
              return res.json(house);
          })
          .catch(next);
    },
    
    /**
     * @api {delete} /house/:id delete a house
     * @apiName deleteHouse
     * @apiGroup House
     * @apiPermission authenticated
     *
     */
    delete: function(req, res, next){
        req.body.id = req.params.id;
        gladys.house.delete(req.body)
          .then(function(house){
              return res.json(house);
          })
          .catch(next);
    },
    
    /**
     * @api {get} /house/:id/user get all user in a house
     * @apiName getUserHouse
     * @apiGroup House
     * @apiPermission authenticated
     *
     * @apiUse UserSuccess 
     */
    getUsers: function(req, res, next){
        gladys.house.getUsers({house: req.params.id})
          .then(function(users){
              return res.json(users);
          })
          .catch(next);
    }

};

