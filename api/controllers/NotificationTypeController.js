module.exports = {
  index: function(req, res, next) {
    gladys.notificationType
      .get()
      .then(function(notificationTypes) {
        return res.json(notificationTypes);
      })
      .catch(next);
  }
};
