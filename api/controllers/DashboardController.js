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

   index : function (req, res, next){
        gladys.box.get({user:req.session.User, view: 'dashboard'})
            .then(function(boxs){
                return res.view('dashboard/index', { User: req.session.User, boxs: boxs, pageName: req.__('pagename-homepage') }); 
            }); 
  },

  parametres : function(req, res, next){
  	res.view('parametres/index', { User: req.session.User, pageName: req.__('pagename-parametres') });
  },

  scenario :function(req,res,next){
    res.view('scenario/index', {User:req.session.User , pageName: req.__('pagename-scenario') });
  },

  script:function(req,res,next){
    res.view('script/index',  { User: req.session.User, pageName: req.__('pagename-script') });
  },

  maps:function(req,res,next){
    res.view('maps/index',  { User: req.session.User, pageName: req.__('pagename-maps') });
  },
  
  device: function(req,res,next){
    res.view('device/index',  { User: req.session.User, pageName: req.__('pagename-device') });
  },
  
  module: function(req, res, next){
      res.view('module/index', { User: req.session.User, pageName: req.__('pagename-module') });
  },

  alarm:function(req,res,next){
    res.view('alarm/index', {User: req.session.User, pageName: req.__('pagename-alarm')});
  },

  me:function(req,res,next){
    res.view('me/index', {User: req.session.User, pageName: req.__('pagename-me')});
  },

  sentence(req, res, next) {
    res.view('sentence/index', {User: req.session.User, pageName: req.__('pagename-sentence')});
  }

};

