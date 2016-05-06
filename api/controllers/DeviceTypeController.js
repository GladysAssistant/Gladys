
/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */
  
module.exports = {
    
   /**
    * Return all deviceTypes
    */
   index: function(req, res, next){
       gladys.deviceType.getAll()
         .then(function(deviceTypes){
             return res.json(deviceTypes);
         })
         .catch(next);
   },
    
   /**
    *  Create a deviceType
    */ 
   create: function(req, res, next){
     
     gladys.deviceType.create(req.body)
           .then(function(deviceType){
               return res.json(deviceType);
           }) 
           .catch(next);
   },
  
  /**
   * Exec a command
   */
  exec: function(req, res, next){
      gladys.deviceType.exec({devicetype: req.params.id, value: req.body.value})
            .then(function(state){
                return res.json(state);
            })
            .catch(next);
  },
  
  
  getByRoom: function(req, res, next){
      gladys.deviceType.getByRoom()
        .then(function(roomsDeviceTypes){
           return res.json(roomsDeviceTypes); 
        })
        .catch(next);
  }
  
};