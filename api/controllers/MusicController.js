
/**
 * @apiDefine MusicParam
 * @apiParam {Integer} [devicetype] DeviceType ID
 * @apiParam {Integer} [room] Room ID 
 * @apiDescription You can put the devicetype attribute OR the room attribute to determine in which room you want to control the music/which precise deviceType is playing.
 */

module.exports = {
   

   /**
     * @api {post} /music/flushqueue Flush Queue
     * @apiName MusicFlushQueue
     * @apiGroup Music
     * @apiPermission authenticated
     *
     * @apiUse MusicParam
     */
    flushQueue: function(req, res, next){
        gladys.music.flushQueue(req.body)
            .then((result) => res.json(result))
            .catch(next);
    },

    /**
     * @api {get} /music/currenttrack Get Current Track
     * @apiName MusicGetCurrentTrack
     * @apiGroup Music
     * @apiPermission authenticated
     *
     * @apiUse MusicParam
     * 
     * @apiSuccess {String} title Title of the current track
     * @apiSuccess {String} artist Artist of the current track
     */
    getCurrentTrack: function(req, res, next){
        gladys.music.getCurrentTrack(req.query)
            .then((result) => res.json(result))
            .catch(next);
    },

    /**
     * @api {get} /music/queue Get Queue
     * @apiName MusicGetQueue
     * @apiGroup Music
     * @apiPermission authenticated
     *
     * @apiUse MusicParam
     * 
     * @apiSuccess {String} title Title of the current track
     * @apiSuccess {String} artist Artist of the current track
     */
    getQueue: function(req, res, next){
        gladys.music.getQueue(req.query)
            .then((result) => res.json(result))
            .catch(next);
    },

    /**
     * @api {get} /music/muted Get Muted
     * @apiName MusicGetMuted
     * @apiGroup Music
     * @apiPermission authenticated
     *
     * @apiUse MusicParam
     * 
     * @apiSuccess {boolean} muted Returns true if the music is muted
     */
    getMuted: function(req, res, next){
        gladys.music.getMuted(req.query)
            .then((result) => res.json(result))
            .catch(next);
    },

    /**
     * @api {get} /music/playing Get Playing
     * @apiName MusicGetPlaying
     * @apiGroup Music
     * @apiPermission authenticated
     *
     * @apiUse MusicParam
     * 
     * @apiSuccess {boolean} playing Returns true if the music is playing
     */
    getPlaying: function(req, res, next){
        gladys.music.getPlaying(req.query)
            .then((result) => res.json(result))
            .catch(next);
    },

    /**
     * @api {get} /music/playlist Get Playlists
     * @apiName MusicGetPlaylist
     * @apiGroup Music
     * @apiPermission authenticated
     *
     * @apiUse MusicParam
     * 
     * @apiSuccess {String} title Title of the playlist
     */
    getPlaylists: function(req, res, next){
        gladys.music.getPlaylists(req.query)
            .then((result) => res.json(result))
            .catch(next);
    },

    /**
     * @api {get} /music/volume Get Volume
     * @apiName MusicGetVolume
     * @apiGroup Music
     * @apiPermission authenticated
     *
     * @apiUse MusicParam
     * 
     * @apiSuccess {integer} volume Volume of the music
     */
    getVolume: function(req, res, next){
        gladys.music.getVolume(req.query)
            .then((result) => res.json(result))
            .catch(next);
    },

    /**
     * @api {post} /music/next Next 
     * @apiName MusicNext
     * @apiGroup Music
     * @apiPermission authenticated
     *
     * @apiUse MusicParam
     */
    next: function(req, res, next){
        gladys.music.next(req.body)
            .then((result) => res.json(result))
            .catch(next);
    },

    /**
     * @api {post} /music/pause Pause 
     * @apiName MusicPause
     * @apiGroup Music
     * @apiPermission authenticated
     *
     * @apiUse MusicParam
     */
    pause: function(req, res, next){
        gladys.music.pause(req.body)
            .then((result) => res.json(result))
            .catch(next);
    },

    /**
     * @api {post} /music/play Play 
     * @apiName MusicPlay
     * @apiGroup Music
     * @apiPermission authenticated
     *
     * @apiUse MusicParam
     */
    play: function(req, res, next){
        gladys.music.play(req.body)
            .then((result) => res.json(result))
            .catch(next);
    },

    /**
     * @api {post} /music/playplaylist Play playlist 
     * @apiName MusicNext
     * @apiGroup Music
     * @apiPermission authenticated
     *
     * @apiUse MusicParam
     * @apiParam {String} identifier Identifier of the playlist
     */
    playPlaylist: function(req, res, next){
        gladys.music.playPlaylist(req.body)
            .then((result) => res.json(result))
            .catch(next);
    },

    /**
     * @api {post} /music/previous Previous 
     * @apiName MusicPrevious
     * @apiGroup Music
     * @apiPermission authenticated
     *
     * @apiUse MusicParam
     */
    previous: function(req, res, next){
        gladys.music.previous(req.body)
            .then((result) => res.json(result))
            .catch(next);
    },

    /**
     * @api {post} /music/queue Queue 
     * @apiName MusicQueue
     * @apiGroup Music
     * @apiPermission authenticated
     *
     * @apiUse MusicParam
     * @apiParam {String} uri Unique uri identifying the music to play
     */
    queue: function(req, res, next){
        gladys.music.queue(req.body)
            .then((result) => res.json(result))
            .catch(next);
    },

    /**
     * @api {post} /music/muted Set muted 
     * @apiName MusicSetMuted
     * @apiGroup Music
     * @apiPermission authenticated
     *
     * @apiUse MusicParam
     * @apiParam {boolean} muted true if sound is muted
     */
    setMuted: function(req, res, next){
        gladys.music.setMuted(req.body)
            .then((result) => res.json(result))
            .catch(next);
    },

     /**
     * @api {post} /music/volume Set Volume 
     * @apiName MusicSetVolume
     * @apiGroup Music
     * @apiPermission authenticated
     *
     * @apiUse MusicParam
     * @apiParam {integer} volume Volume level
     */
    setVolume: function(req, res, next){
        gladys.music.setVolume(req.body)
            .then((result) => res.json(result))
            .catch(next);
    },

    /**
     * @api {post} /music/stop Stop 
     * @apiName MusicStop
     * @apiGroup Music
     * @apiPermission authenticated
     *
     * @apiUse MusicParam
     */
    stop: function(req, res, next){
        gladys.music.stop(req.body)
            .then((result) => res.json(result))
            .catch(next);
    },
};

