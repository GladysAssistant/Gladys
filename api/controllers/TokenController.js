
module.exports = {

	index : function(req,res,next) {
		gladys.token.get(req.session.User)
		  .then(function(tokens){
			  return res.json(tokens);
		  })
		  .catch(next);
	},

	create : function(req, res, next) {
		req.body.user = req.session.User.id;
		gladys.token.create(req.body)
		  .then(function(token){
			  return res.status(201).json(token);
		  })
		  .catch(next);
	},

	delete : function(req,res,next) {
		gladys.token.delete({id: req.params.id})
		  .then(function(){
			  return res.json({success: true});
		  })
		  .catch(next);
	},

	update: function(req,res,next) {
		req.body.id = req.params.id;
		gladys.token.update(req.body)
		  .then(function(token){
			  return res.json(token);
		  })
		  .catch(next);
	}
	
};

