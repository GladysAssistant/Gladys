module.exports = {
  /**
   * Get notifications with pagination
   */
  index: function(req, res, next) {
    req.query.user = req.session.User;
    gladys.notification
      .get(req.query)
      .then(function(notifications) {
        return res.json(notifications);
      })
      .catch(next);
  },

  /**
   * @api {post} /notification Create notification
   * @apiName createNotification
   * @apiGroup Notification
   * @apiPermission authenticated
   *
   * @apiParam {string} title Title of the notification
   * @apiParam {string} text Text of the notification
   * @apiParam {string} icon  font-awesome icon. Ex: 'fa fa-fire'
   * @apiParam {string} iconColor  bg-color, ex: 'bg-yellow',
   * @apiParam {integer}  priority priority from -1 to 2
   *
   */
  create: function(req, res, next){
    req.body.user = req.session.User.id;
    gladys.notification.create(req.body)
      .then(function(notification){
        return res.status(201).json(notification);
      })
      .catch(next);
  },

  /**
   * Read notifications from a particular user
   */
  read: function(req, res, next) {
    gladys.notification
      .read(req.session.User)
      .then(notifications => res.json(notifications))
      .catch(next);
  }
};
