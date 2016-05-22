/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */
  
module.exports = {
  
  index: function(req, res, next){
    gladys.alarm.get(req.session.User)
      .then(function(alarms){
        return res.json(alarms);
      })
      .catch(next);
  },
  
  create: function(req, res, next){
    req.body.user = req.session.User.id;
    gladys.alarm.create(req.body)
      .then(function(alarm){
        return res.status(201).json(alarm);
      })
      .catch(next);
  },
  
  delete: function(req, res, next){
    gladys.alarm.delete({id: req.params.id})
      .then(function(){
        return res.json({success: true});
      })
      .catch(next);
  }
	
};