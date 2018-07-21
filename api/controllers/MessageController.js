
/**
 * @apiDefine MessageSuccess
 * @apiSuccess {Integer} id primary key
 * @apiSuccess {String} text Message content
 * @apiSuccess {Datetime} datetime Datetime of the message
 * @apiSuccess {Integer} sender Message sender id
 * @apiSuccess {Integer} receiver Message receiver id
 * @apiSuccess {Integer} sender Message sender id
 * @apiSuccess {uuid} conversation Conversation unique ID (identify uniquely a discussion)
 */

/**
 * @apiDefine MessageParam 
 * @apiParam {String} text Message content
 * @apiParam {Integer} receiver The person you are sending the message too. Put null to contact Gladys.
 */

module.exports = {


     /**
     * @api {post} /message Send message
     * @apiName SendMessage
     * @apiGroup Message
     * @apiPermission authenticated
     *
     * @apiUse MessageParam
     * @apiUse MessageSuccess
     */
    send: function(req, res, next) {
        gladys.message.send(req.session.User, req.body)
            .then((response) => res.json(response))
            .catch(next);
    },

    /**
     * @api {get} /message/user/:id Get messages
     * @apiName GetMessages
     * @apiGroup Message
     * @apiPermission authenticated
     *
     * @apiParam {Integer} take Number of elements to return
     * @apiParam {Integer} skip Number of elements to skip
     * 
     * @apiUse MessageSuccess
     */
    getByUser: function(req, res, next) {
        req.query.user = req.params.id;

        // transform null string when you want message exchange with gladys
        if(req.query.user == 'null') req.query.user = null;
        gladys.message.getByUser(req.session.User, req.query)
            .then((messages) => res.json(messages))
            .catch(next);
    },



};