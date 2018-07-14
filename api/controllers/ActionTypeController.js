
module.exports = {

	/**
	 * Get all ActionType
	 */
	index: function(req, res, next) {
		
		gladys.actionType.get()
		  .then(function(actionsTypes){
			  return res.json(actionsTypes);
		  })
		  .catch(next);	
	},
	
	
	/**
	 * Get all actionTypeParams of a specificActionType
	 */
	getParams: function(req, res, next){
		
		gladys.actionType.getParams({id: req.params.id})
		  .then(function(params){
			  return res.json(params);
		  })
		  .catch(next);
	}

};