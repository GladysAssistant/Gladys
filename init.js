#!/usr/bin/env node

// force dev ENV
process.env.NODE_ENV = 'development';

var sailsApp = require('./index.js');

var config = {
    hooks: {
        grunt: false,
        userhooks: false
    }
};

sailsApp.start(config, function(err, app){
    if(err) {
        console.log(err);
        process.exit(1);
    }
    
    console.log('Gladys started with success');
    
    app.after('lifted', function(){
       
       // if we don't wait, it crashed for already in use port
       setTimeout(function(){
        app.lower(function(){
            process.exit();
        });    
        console.log('Init with success !');
       }, 200);
    });
});