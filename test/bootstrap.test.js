var Sails = require('sails'),
  sails;

var Barrels = require('barrels');
var Promise = require('bluebird');

var should = require('should'); // eslint-disable-line

if (process.env.NODE_ENV === 'development') {
  require('dotenv').config();
}

/*
log: {
      level: 'error'
    },
    */

// Gobal before
before(function(done) {
  var connectionName = 'test';
  if (process.env.TRAVIS) {
    connectionName = 'travis';
  }

  Sails.lift(
    {
      models: {
        connection: connectionName,
        migrate: 'drop'
      }
    },
    function(err, server) {
      sails = server;
      if (err) {
        return done(err); 
      }

      // adding a fake module for tests
      addTestModuleGladys(gladys);

      done(err, sails);
    }
  );
});

beforeEach(function(done) {
  this.timeout(40000);
  fillDatabaseWithFixtures(function(err) {
    if (err) {
      return done(err); 
    }

    gladys.param
      .clearCache()
      .then(function() {
        return gladys.paramUser.clearCache();
      })
      .then(done)
      .catch(done);
  });
});

after(function(done) {
  // here you can clear fixtures, etc.
  sails.lower(function() {
    done();
  });
});

function fillDatabaseWithFixtures(done) {
  // Load fixtures
  var barrels = new Barrels();

  // Save original objects in `fixtures` variable
  fixtures = barrels.data;

  loadFixtures(barrels)
    .then(function() {
      done();
    })
    .catch(function(err) {
      sails.log.warn('Error while loading fixtures');
      done(err);
    });
}

function loadFixtures(barrels) {
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
    'statetemplateparam',
    'message',
    'answer'
  ];

  return Promise.mapSeries(order, function(tableName) {
    return load(tableName, barrels);
  });
}

// load fixture for one table
function load(tableName, barrels) {
  return new Promise(function(resolve, reject) {
    barrels.populate([tableName], function(err) {
      if (err) {
        return reject(err); 
      }

      resolve();
    });
  });
}

function addTestModuleGladys(gladys) {
  // simulating fake test module
  gladys.modules.test = {
    exec: function() {
      return Promise.resolve();
    },
    conditionTrue: function() {
      return Promise.resolve(true);
    },
    conditionFalse: function() {
      return Promise.resolve(false);
    },
    notify: function(notif, user) {
      console.log('Test notification');
      return Promise.resolve();
    },
    install: function() {
      return Promise.resolve();
    },
    command: function() {
      return Promise.resolve();
    },
    weather: {
      get: function(options) {
        return Promise.resolve({ temperature: 12, humidity: 0.9, weather: 'rain' });
      }
    },
    calendar: {
      sync: function() {
        return Promise.resolve();
      }
    },
    direction: {
      travelTime: function() {
        return Promise.resolve({
          departure_time: 1495915223,
          arrival_time: 1495918128,
          duration: 2905
        });
      }
    },
    music: {
      flushQueue: function() {
        return Promise.resolve();
      },
      getCurrentTrack: function() {
        return Promise.resolve({ title: 'test', artist: 'test' });
      },
      getQueue: function() {
        return Promise.resolve([{ title: 'test', artist: 'test' }]);
      },
      getMuted: function() {
        return Promise.resolve({ muted: true });
      },
      getPlaying: function() {
        return Promise.resolve({ playing: true });
      },
      getPlaylists: function() {
        return Promise.resolve([{ title: 'test' }]);
      },
      getVolume: function() {
        return Promise.resolve({ volume: 1 });
      },
      next: function() {
        return Promise.resolve();
      },
      pause: function() {
        return Promise.resolve();
      },
      play: function() {
        return Promise.resolve();
      },
      playPlaylist: function() {
        return Promise.resolve();
      },
      previous: function() {
        return Promise.resolve();
      },
      queue: function() {
        return Promise.resolve();
      },
      setMuted: function() {
        return Promise.resolve();
      },
      setVolume: function() {
        return Promise.resolve();
      },
      stop: function() {
        return Promise.resolve();
      }
    },
    television: {
      switchState: function() {
        return Promise.resolve();
      },
      getState: function() {
        return Promise.resolve({ state: 'on' });
      },
      setChannel: function() {
        return Promise.resolve();
      },
      getChannel: function() {
        return Promise.resolve([{ channel: '1' }, { channel: '2' }, { channel: '3' }]);
      },
      getCurrentChannel: function() {
        return Promise.resolve({ channel: '1' });
      },
      getMuted: function() {
        return Promise.resolve([{ mute: '1' }]);
      },
      getVolume: function() {
        return Promise.resolve();
      },
      fastForward: function() {
        return Promise.resolve();
      },
      rewind: function() {
        return Promise.resolve();
      },
      pause: function() {
        return Promise.resolve();
      },
      play: function() {
        return Promise.resolve();
      },
      setMuted: function() {
        return Promise.resolve();
      },
      setVolume: function() {
        return Promise.resolve();
      },
      stop: function() {
        return Promise.resolve();
      },
      volumeUp: function() {
        return Promise.resolve();
      },
      volumeDown: function() {
        return Promise.resolve();
      },
      pressKey: function() {
        return Promise.resolve();
      },
      getSources: function() {
        return Promise.resolve([{ label: 'HDMI1' }, { label: 'HDMI2' }, { label: 'VGA' }]);
      },
      openSource: function() {
        return Promise.resolve();
      },
      openMenu: function() {
        return Promise.resolve();
      },
      rec: function() {
        return Promise.resolve();
      },
      redButton: function() {
        return Promise.resolve();
      },
      greenButton: function() {
        return Promise.resolve();
      },
      yellowButton: function() {
        return Promise.resolve();
      },
      blueButton: function() {
        return Promise.resolve();
      }
    }
  };

  gladys.modules.test2 = {
    exec: function() {
      return Promise.resolve();
    }
  };

  // register direction module
  gladys.direction.addProvider('test');

  // register weather module
  gladys.weather.addProvider('test');
}
