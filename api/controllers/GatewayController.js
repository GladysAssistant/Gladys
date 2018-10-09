module.exports = {

  login: function(req, res, next) {
    gladys.gateway.login(req.body.email, req.body.password, req.body.two_factor_code)
      .then(() => res.json())
      .catch(next);
  }
};