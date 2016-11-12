var request = require('supertest');

describe('MusicController', function() {

  describe('sendComand', function() {
    
    it('POST /music/flushqueue', function (done) {
        
        var params = {
            room: 1
        };
        
     	request(sails.hooks.http.app)
        .post('/music/flushqueue?token=test')
        .send(params)
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);
            
            done();
        });

    });

    it('GET /music/currenttrack', function (done) {
        
     	request(sails.hooks.http.app)
        .get('/music/currenttrack?token=test&room=1')
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);

            res.body.should.have.property('title');
            res.body.should.have.property('artist');
            
            done();
        });

    });

    it('GET /music/queue', function (done) {
        
     	request(sails.hooks.http.app)
        .get('/music/queue?token=test&room=1')
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);

            res.body.should.be.instanceOf(Array);
            res.body[0].should.have.property('title');
            res.body[0].should.have.property('artist');
            
            done();
        });

    });

    it('GET /music/muted ', function (done) {
        
     	request(sails.hooks.http.app)
        .get('/music/muted?token=test&room=1')
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);

            res.body.should.have.property('muted');
            
            done();
        });

    });

     it('GET /music/playing ', function (done) {
        
     	request(sails.hooks.http.app)
        .get('/music/playing?token=test&room=1')
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);

            res.body.should.have.property('playing');
            
            done();
        });

    });

    it('GET /music/playlist ', function (done) {
        
     	request(sails.hooks.http.app)
        .get('/music/playlist?token=test&room=1')
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);

            res.body.should.be.instanceOf(Array);
            res.body[0].should.have.property('title');
            
            done();
        });

    });

    it('GET /music/volume ', function (done) {
        
     	request(sails.hooks.http.app)
        .get('/music/volume?token=test&room=1')
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);

            res.body.should.have.property('volume');
            
            done();
        });

    });

    it('POST /music/next', function (done) {
        
        var params = {
            room: 1
        };
        
     	request(sails.hooks.http.app)
        .post('/music/next?token=test')
        .send(params)
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);
            
            done();
        });

    });

    it('POST /music/pause', function (done) {
        
        var params = {
            room: 1
        };
        
     	request(sails.hooks.http.app)
        .post('/music/pause?token=test')
        .send(params)
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);
            
            done();
        });

    });

    it('POST /music/play', function (done) {
        
        var params = {
            room: 1
        };
        
     	request(sails.hooks.http.app)
        .post('/music/play?token=test')
        .send(params)
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);
            
            done();
        });

    });

    it('POST /music/playplaylist', function (done) {
        
        var params = {
            room: 1,
            identifier: '1'
        };
        
     	request(sails.hooks.http.app)
        .post('/music/playplaylist?token=test')
        .send(params)
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);
            
            done();
        });

    });

    it('POST /music/previous', function (done) {
        
        var params = {
            room: 1
        };
        
     	request(sails.hooks.http.app)
        .post('/music/previous?token=test')
        .send(params)
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);
            
            done();
        });

    });

    it('POST /music/queue', function (done) {
        
        var params = {
            room: 1,
            uri: 'http://test.com/mysong.mp3'
        };
        
     	request(sails.hooks.http.app)
        .post('/music/queue?token=test')
        .send(params)
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);
            
            done();
        });

    });

    it('POST /music/muted', function (done) {
        
        var params = {
            room: 1,
            muted: true
        };
        
     	request(sails.hooks.http.app)
        .post('/music/muted?token=test')
        .send(params)
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);
            
            done();
        });

    });

    it('POST /music/volume', function (done) {
        
        var params = {
            room: 1,
            volume: 20
        };
        
     	request(sails.hooks.http.app)
        .post('/music/volume?token=test')
        .send(params)
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);
            
            done();
        });

    });

    it('POST /music/stop', function (done) {
        
        var params = {
            room: 1
        };
        
     	request(sails.hooks.http.app)
        .post('/music/stop?token=test')
        .send(params)
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);
            
            done();
        });

    });

    
  });


});