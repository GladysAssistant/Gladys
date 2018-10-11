var request = require('supertest');

describe('TelevisionController', function() {

  describe('sendComand', function() {
   
    it('POST /television/state', function (done) {
        
        var params = {
            device: 5
        };
        
     	request(sails.hooks.http.app)
        .post('/television/state?token=test')
        .send(params)
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);
            
            done();
        });

    });

    it('GET /television/5/state', function (done) {
        
     	request(sails.hooks.http.app)
        .get('/television/5/state?token=test')
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);

            res.body.should.have.property('state');
            
            done();
        });

    });

    it('POST /television/channel', function (done) {

        var params = {
            channel: 1,
            device: 5
        };
        
     	request(sails.hooks.http.app)
        .post('/television/channel?token=test')
        .send(params)
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);
            
            done();
        });

    });

    it('GET /television/5/channel ', function (done) {
        
     	request(sails.hooks.http.app)
        .get('/television/5/channel?token=test')
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);

            res.body.should.be.instanceOf(Array);
            res.body[0].should.have.property('channel');
            
            done();
        });

    });

    it('GET /television/5/mute ', function (done) {
        
     	request(sails.hooks.http.app)
        .get('/television/5/mute?token=test')
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);

            res.body.should.be.instanceOf(Array);
            res.body[0].should.have.property('mute');
            
            done();
        });

    });

    it('GET /television/5/source ', function (done) {
        
        request(sails.hooks.http.app)
       .get('/television/5/source?token=test')
       .expect(200)
       .end(function(err, res) {
           if(err) return done(err);

           res.body.should.be.instanceOf(Array);
           res.body[0].should.have.property('label');

           done();
       });

   });

    it('POST /television/mute ', function (done) {

        var params = {
            mute: false,
            device: 5
        };
        
     	request(sails.hooks.http.app)
        .post('/television/mute?token=test')
        .send(params)
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);
            
            done();
        });

    });

    it('POST /television/fastforward ', function (done) {

        var params = {
            controlType:'fastForward',
            device: 5
        };
        
     	request(sails.hooks.http.app)
        .post('/television/fastforward?token=test')
        .send(params)
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);
            
            done();
        });

    });

    it('POST /television/pause ', function (done) {

        var params = {
            controlType:'pause',
            device: 5
        };
        
     	request(sails.hooks.http.app)
        .post('/television/pause?token=test')
        .send(params)
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);
            
            done();
        });

    });

    it('POST /television/play ', function (done) {

        var params = {
            controlType:'play',
            device: 5
        };
        
     	request(sails.hooks.http.app)
        .post('/television/play?token=test')
        .send(params)
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);
            
            done();
        });

    });

    it('POST /television/rewind ', function (done) {

        var params = {
            controlType:'rewind',
            device: 5
        };
        
     	request(sails.hooks.http.app)
        .post('/television/rewind?token=test')
        .send(params)
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);
            
            done();
        });

    });

    it('POST /television/stop ', function (done) {

        var params = {
            controlType:'stop',
            device: 5
        };
        
     	request(sails.hooks.http.app)
        .post('/television/stop?token=test')
        .send(params)
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);
            
            done();
        });

    });

    it('POST /television/presskey ', function (done) {

        var params = {
            key:'up',
            device: 5
        };
        
     	request(sails.hooks.http.app)
        .post('/television/presskey?token=test')
        .send(params)
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);
            
            done();
        });

    });

    it('POST /television/volume/down ', function (done) {

        var params = {
            device: 5
        };
        
     	request(sails.hooks.http.app)
        .post('/television/volume/down?token=test')
        .send(params)
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);
            
            done();
        });

    });

    it('POST /television/volume/up ', function (done) {

        var params = {
            device: 5
        };
        
     	request(sails.hooks.http.app)
        .post('/television/volume/up?token=test')
        .send(params)
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);
            
            done();
        });

    });

    it('POST /television/opensource ', function (done) {

        var params = {
            id: 'TV',
            device: 5
        };
        
     	request(sails.hooks.http.app)
        .post('/television/opensource?token=test')
        .send(params)
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);
            
            done();
        });

    });

    it('POST /television/openmenu ', function (done) {

        var params = {
            device: 5
        };
        
     	request(sails.hooks.http.app)
        .post('/television/openmenu?token=test')
        .send(params)
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);
            
            done();
        });

    });

    it('POST /television/rec ', function (done) {

        var params = {
            device: 5
        };
        
     	request(sails.hooks.http.app)
        .post('/television/rec?token=test')
        .send(params)
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);
            
            done();
        });

    });

    it('POST /television/customcommand ', function (done) {

        var params = {
            color: 'red',
            device: 5
        };
        
     	request(sails.hooks.http.app)
        .post('/television/rec?token=test')
        .send(params)
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);
            
            done();
        });

    });

  });

});
