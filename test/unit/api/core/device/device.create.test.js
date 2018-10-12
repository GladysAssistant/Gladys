
var validateDevice = require('../../validator/deviceValidator.js');

describe('Device', function() {
  describe('create', function() {
    it('should return correct device and device types created', function(done) {
      var obj = {
        device: {
          name: 'Light in my room',
          protocol: 'milight',
          service: 'MilightService',
          room: 1
        },

        types: [
          {
            type: 'binary',
            sensor: false,
            min: 0,
            max: 1
          },
          {
            type: 'multilevel',
            sensor: false,
            unit: 'color',
            min: 0,
            max: 100
          }
        ]
      };

      gladys.device
        .create(obj)
        .then(function(result) {
          result.should.have.property('device');
          result.should.have.property('types');
          validateDevice(result.device);
          result.types.should.be.instanceOf(Array);
          result.types[0].should.have.property('id');
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });

    it('should return an error, incorrect device', function(done) {
      var obj = {
        device: {
          name: 'Light in my room',
          protocol: 'milight'
        },

        types: [
          {
            type: 'binary',
            min: 0,
            max: 1
          },
          {
            type: 'multilevel',
            unit: 'color',
            min: 0,
            max: 100
          }
        ]
      };

      gladys.device
        .create(obj)
        .then(function(result) {
          done('No error detected');
        })
        .catch(function(err) {
          done();
        });
    });

    it('should return an error, incorrect types', function(done) {
      var obj = {
        device: {
          name: 'Light in my room',
          protocol: 'milight',
          room: 1
        },

        types: [
          {
            // no type specified...
            unit: 'degrees',
            min: 0,
            max: 100
          }
        ]
      };

      gladys.device
        .create(obj)
        .then(function(result) {
          done('No error detected');
        })
        .catch(function(err) {
          done();
        });
    });
  });
});
