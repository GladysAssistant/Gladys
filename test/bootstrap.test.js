var Sails = require('sails'),
  sails, fixtures;

var Barrels = require('barrels');
var Promise = require('bluebird');

/*
log: {
      level: 'error'
    },
    */

// Gobal before
before(function(done) {
  var connectionName = 'test';
  if(process.env.TRAVIS) {
     connectionName = 'travis'; 
  } 
   
  Sails.lift({
    models: {
      connection: connectionName,
      migrate: 'drop'
    }
  }, function(err, server) {
    sails = server;
    if (err) return done(err);
    
    // adding a fake module for tests
    addTestModuleGladys(gladys);
    
    done(err, sails);

  });
});

beforeEach(function(done){
    this.timeout(20000);
    fillDatabaseWithFixtures(function(err){
        if(err) return done(err);
        
        gladys.param.clearCache()
          .then(function(){
              return gladys.paramUser.clearCache();
          })
          .then(done)
          .catch(done);
    });
});

after(function(done) {
  // here you can clear fixtures, etc.
  sails.lower(function(){
      done();
  });
});


function fillDatabaseWithFixtures(done){
    
     // Load fixtures
    var barrels = new Barrels();

    // Save original objects in `fixtures` variable
    fixtures = barrels.data;
    
    loadFixtures(barrels)
        .then(function(){
            done();
        })
        .catch(function(err){
            sails.log.warn('Error while loading fixtures');
            done(err);
        });
}

function loadFixtures(barrels){
    var order = [
       'user',
       'house',
       'mode',
       'room',
       'token',
       'alarm',
       'device',
       'devicetype',
       'devicestate', 
       'notificationtype',
       'notificationuser',
       'notification',
       'eventtype',
       'launcher',
       'actiontype',
       'actiontypeparam',
       'action',
       'actionparam',
       'statetype',
       'state',
       'event',
       'script',
       'calendar',
       'calendarevent',
       'area',
       'machine',
       'boxtype',
       'box',
       'module',
       'sentence',
       'param',
       'paramuser',
       'location',
       'statetypeparam',
       'stateparam',
       'statetemplateparam'
    ];
    
    return Promise.mapSeries(order, function(tableName){
        return load(tableName, barrels);
    });
}


// load fixture for one table
function load(tableName, barrels){
    
    return new Promise(function(resolve, reject){
       barrels.populate([tableName],function(err) {
            if(err) return reject(err);

            resolve();
        }); 
    });
}

function addTestModuleGladys(gladys){
    
    // simulating fake test module
    gladys.modules.test = {
        exec: function(){
            return Promise.resolve();
        },
        notify: function(){
            console.log('Test notification');
            return Promise.resolve();
        },
        install: function(){
            return Promise.resolve();
        }
    };
}