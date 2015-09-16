
module.exports = {
	
	/**
	 * Render a view with the layout
	 * @req: req of sails
	 * @res: res of sails
	 * @path: The path to the .ejs file starting from hooks folder (ex: example/views/box )
	 * @pageName: the name of the page you want to render
	 */
	resView: function(req, res, path, pageName){
		return res.view(__dirname + '/../hooks/' + path, {
			pageName: pageName,
			User: req.session.User,
			layout: __dirname + '/../../views/layout'
		});
	}	
};