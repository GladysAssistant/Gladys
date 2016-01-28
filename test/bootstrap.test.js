var Sails = require('sails'),
  sails, fixtures;

var Barrels = require('barrels');
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
    
    // Populate the DB
    barrels.populate(['user', 'house'],function(err) {
        if(err) return done(err);
        
        barrels.populate(['room'],function(err) {
            if(err) return done(err);
            
            barrels.populate(['device'],function(err) {
                if(err) return done(err);
                
                 barrels.populate(['devicetype', 'notificationtype'],function(err) {
                        if(err) return done(err);

                        barrels.populate(['devicestate'],function(err) {
                            if(err) return done(err);

                            done();
                        });
                 });
            });
        });
    });  
}