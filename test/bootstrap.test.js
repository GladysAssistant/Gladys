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
  Sails.lift({
    models: {
      connection: 'test',
      migrate: 'drop'
    }
  }, function(err, server) {
    sails = server;
    if (err) return done(err);

    // Load fixtures
    var barrels = new Barrels();

    // Save original objects in `fixtures` variable
    fixtures = barrels.data;

    // Populate the DB
    barrels.populate(['house', 'user'],function(err) {
        console.log('House : '+ err);

        done(err, sails);
    });

  });
});

after(function(done) {
  // here you can clear fixtures, etc.
  sails.lower(done);
});