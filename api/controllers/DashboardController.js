/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */
/**
 * DashboardController
 *
 * @description :: Server-side logic for managing the dashboard
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {

	/**
	 * Description
	 * @method index
	 * @param {} req
	 * @param {} res
	 * @param {} next
	 * @return 
	 */
	index : function (req, res, next){
    DashboardBox.find()
        .exec(function(err, boxs){
            if(err) return res.json(err);
    
            return res.view('dashboard/index', { User: req.session.User, boxs:boxs, pageName: req.__('pagename-homepage') });  
        });
  },

  /**
   * Description
   * @method parametres
   * @param {} req
   * @param {} res
   * @param {} next
   * @return 
   */
  parametres : function(req, res, next){
  	res.view('parametres/index', { User: req.session.User, pageName: req.__('pagename-parametres') });
  },

  /**
   * Description
   * @method scenario
   * @param {} req
   * @param {} res
   * @param {} next
   * @return 
   */
  scenario :function(req,res,next){
    res.view('scenario/index', {User:req.session.User , pageName: req.__('pagename-scenario') });
  },

  /**
   * Description
   * @method house
   * @param {} req
   * @param {} res
   * @param {} next
   * @return 
   */
  house : function(req,res,next) {
  	return res.view('house/index' ,  { User: req.session.User, pageName: req.__('pagename-house') });
  },

  /**
   * Description
   * @method room
   * @param {} req
   * @param {} res
   * @param {} next
   * @return 
   */
  room : function(req,res,next) {
  	res.view('room/index' ,  { User: req.session.User, pageName: req.__('pagename-room') });
  },

  /**
   * Description
   * @method script
   * @param {} req
   * @param {} res
   * @param {} next
   * @return 
   */
  script:function(req,res,next){
    res.view('script/index',  { User: req.session.User, pageName: req.__('pagename-script') });
  },
  
  device: function(req,res,next){
    res.view('device/index',  { User: req.session.User, pageName: req.__('pagename-device') });
  },
  
  installation :function(req,res,next){
    res.view('installation/index',  { User: req.session.User, pageName: req.__('pagename-installation'), layout: null });
  },

  /**
   * Description
   * @method sensor
   * @param {} req
   * @param {} res
   * @param {} next
   * @return 
   */
  sensor:function(req,res,next){
    res.view('sensor/index', {User: req.session.User, pageName: req.__('pagename-sensor') });
  },

  alarm:function(req,res,next){
    res.view('alarm/index', {User: req.session.User, pageName: req.__('pagename-alarm')});
  },

  me:function(req,res,next){
    res.view('me/index', {User: req.session.User, pageName: req.__('pagename-me')});
  },

};

