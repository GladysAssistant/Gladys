module.exports = {
  index: function(req, res, next) {
    gladys.paramUser
      .get(req.session.User)
      .then(function(paramUsers) {
        return res.json(paramUsers);
      })
      .catch(next);
  },

  create: function(req, res, next) {
    req.body.user = req.session.User.id;
    gladys.paramUser
      .setValue(req.body)
      .then(function(paramUser) {
        return res.status(201).json(paramUser);
      })
      .catch(next);
  },

  update: function(req, res, next) {
    req.body.user = req.session.User.id;
    req.body.name = req.params.name;
    gladys.paramUser
      .setValue(req.body)
      .then(function(paramUser) {
        return res.json(paramUser);
      })
      .catch(next);
  },

  delete: function(req, res, next) {
    req.body.user = req.session.User.id;
    req.body.name = req.params.name;
    gladys.paramUser
      .delete(req.body)
      .then(function() {
        return res.json({ success: true });
      })
      .catch(next);
  }
};
