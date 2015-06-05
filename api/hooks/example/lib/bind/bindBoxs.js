var path = require('path');
var async = require('async');
var fs = require('fs');
var param = require('../parametres.js');

module.exports = function(sails, cb) {
    cb = cb || function() {};
    
    // register in the database only when sails is ready!
     sails.config.Event.on('sailsReady', function(){
         async.each(param.dashboardBoxs, injectBox, function(err){
                if(err) return cb(err);
                
                cb();
           });  
     });
    
    /** 
     * Register the box in the database
     */
    function injectBox(box,callback){
        var filePath = path.join(__dirname, '../../views/', box.file);
        
        // we read the file
        fs.readFile(filePath, function (err, data) {
          if (err) {
              box.html = "";
          }else{
              box.html = data;
          }
          DashboardBox.create(box).exec(callback);
        });
    }
};