const path = require('path');
const fs = require('fs');
const BASE_PATH = path.join(__dirname, '../../');

module.exports = {

   index : function (req, res, next){
        gladys.box.get({user:req.session.User, view: 'dashboard'})
            .then(function(boxs){
                return res.view('dashboard/index', { User: req.session.User, boxs: boxs, pageName: req.__('pagename-homepage'), basePath: BASE_PATH}); 
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

  moduleConfigView: function(req, res, next){
    gladys.module.getById({id: req.params.id})
      .then((module) => {
        var moduleConfigViewPath = `${BASE_PATH}/api/hooks/${module.slug}/views/configuration.ejs`;
        fs.access(moduleConfigViewPath, fs.constants.F_OK, (err) => {
          var moduleConfigViewExist = !err;
          var configurationFunctionExist = (gladys.modules[module.slug] && gladys.modules[module.slug].setup && typeof gladys.modules[module.slug].setup === 'function');
          res.view('module/module-config-view', { User: req.session.User, pageName: req.__('pagename-module'), module, moduleConfigViewPath, moduleConfigViewExist, configurationFunctionExist});
        });        
      })
      .catch(next);
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

