
module.exports = {
   
    flushQueue: function(req, res, next){
        gladys.music.flushQueue(req.body)
            .then((result) => res.json(result))
            .catch(next);
    },

    getCurrentTrack: function(req, res, next){
        gladys.music.getCurrentTrack(req.query)
            .then((result) => res.json(result))
            .catch(next);
    },

    getQueue: function(req, res, next){
        gladys.music.getQueue(req.query)
            .then((result) => res.json(result))
            .catch(next);
    },

    getMuted: function(req, res, next){
        gladys.music.getMuted(req.query)
            .then((result) => res.json(result))
            .catch(next);
    },

    getPlaylists: function(req, res, next){
        gladys.music.getPlaylists(req.query)
            .then((result) => res.json(result))
            .catch(next);
    },

    getVolume: function(req, res, next){
        gladys.music.getVolume(req.query)
            .then((result) => res.json(result))
            .catch(next);
    },

    next: function(req, res, next){
        gladys.music.next(req.body)
            .then((result) => res.json(result))
            .catch(next);
    },

    pause: function(req, res, next){
        gladys.music.pause(req.body)
            .then((result) => res.json(result))
            .catch(next);
    },

    play: function(req, res, next){
        gladys.music.play(req.body)
            .then((result) => res.json(result))
            .catch(next);
    },

    playPlaylist: function(req, res, next){
        gladys.music.playPlaylist(req.body)
            .then((result) => res.json(result))
            .catch(next);
    },

    previous: function(req, res, next){
        gladys.music.previous(req.body)
            .then((result) => res.json(result))
            .catch(next);
    },

    queue: function(req, res, next){
        gladys.music.queue(req.body)
            .then((result) => res.json(result))
            .catch(next);
    },

    setMuted: function(req, res, next){
        gladys.music.setMuted(req.body)
            .then((result) => res.json(result))
            .catch(next);
    },

    setVolume: function(req, res, next){
        gladys.music.setVolume(req.body)
            .then((result) => res.json(result))
            .catch(next);
    },

    stop: function(req, res, next){
        gladys.music.stop(req.body)
            .then((result) => res.json(result))
            .catch(next);
    },
};

