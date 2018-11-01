module.exports = {

  login: function(req, res, next) {
    gladys.gateway.login(req.body.email, req.body.password, req.body.two_factor_code)
    res.json({ message: 'key generation and login started...'});
  },

  isConnected: function(req, res, next) {
    res.json({
      connected: gladys.gateway.isConnected()
    });
  },

  getKeysFingerprint: function(req, res, next) {
    gladys.gateway.getKeysFingerprint()
      .then((fingerprints) => res.json(fingerprints))
      .catch(next);
  },

  getUsersKeys: function(req, res, next) {
    gladys.gateway.getUsersKeys()
      .then((users) => res.json(users))
      .catch(next);
  },

  saveUsersKeys: function(req, res, next) {
    gladys.gateway.saveUsersKeys(req.body)
      .then(() => res.json({ success: true }))
      .catch(next);
  } 

};