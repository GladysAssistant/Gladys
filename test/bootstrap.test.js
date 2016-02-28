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

    done(err, sails);

  });
});

beforeEach(function(done){
    fillDatabaseWithFixtures(done);
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
        .catch(done);
}

function loadFixtures(barrels){
    var order = [
       'user',
       'house',
       'room',
       'token',
       'alarm',
       'device',
       'devicetype',
       'devicestate', 
       'notificationtype',
       'launchertype',
       'launcher',
       'actiontype',
       'action'
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