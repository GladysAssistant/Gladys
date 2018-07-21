
module.exports = {

	/**
	 * Description
	 * @method index
	 * @param {} req
	 * @param {} res
	 * @return 
	 */
	index : function(req,res){
		req.session.authenticated = false;
		res.view('lock/index', {layout: null, User: req.session.User});
	}
	
};

