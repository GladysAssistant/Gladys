/**
 * Bootstrap
 * (sails.config.bootstrap)
 *
 * An asynchronous bootstrap function that runs before your Sails app gets lifted.
 * This gives you an opportunity to set up your data model, run jobs, or perform some special logic.
 *
 * For more information on bootstrapping your app, check out:
 * http://sailsjs.org/#/documentation/reference/sails.config/sails.config.bootstrap.html
 */

module.exports.bootstrap = function(cb) {
	DashboardBox.destroy()
		.exec(function(err){
			if(err) {
				sails.log.error("Can't reset dashboard boxs list at startup.");
				cb(err);
			}else{
				StartService.onStart();
			}
	});
	cb();
	//sails.hooks.orm.reload();
	//
	// Start all the function that need to be started at startup
	
	// It's very important to trigger this callback method when you are finished
	// with the bootstrap!  (otherwise your server will never lift, since it's waiting on the bootstrap)
	
};
