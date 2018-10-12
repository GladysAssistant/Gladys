module.exports = {
  index: function(req, res, next) {
    gladys.notificationUser.get(req.session.User).then(function(notificationUsers) {
      return res.json(notificationUsers);
    });
  },

  create: function(req, res, next) {
    req.body.user = req.session.User.id;
    gladys.notificationUser
      .create(req.body)
      .then(function(notificationUser) {
        return res.status(201).json(notificationUser);
      })
      .catch(next);
  },

  update: function(req, res, next) {
    req.body.id = req.params.id;
    gladys.notificationUser
      .update(req.body)
      .then(function(notificationUser) {
        return res.json(notificationUser);
      })
      .catch(next);
  },

  delete: function(req, res, next) {
    gladys.notificationUser
      .delete({ id: req.params.id })
      .then(function() {
        return res.json({ success: true });
      })
      .catch(next);
  }
};
