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
  * Create a notification
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
