module.exports = {

  login: function(req, res, next) {
    gladys.gateway.login(req.body.email, req.body.password, req.body.two_factor_code)
      .then(() => res.json())
      .catch((err) => {
        if(err && err.response && err.response.status) {
          res.status(err.response.status).json(err.response.data);
        } else if( err instanceof Error && err.message === '2FA_NOT_ENABLED') {
          res.status(403).json({
            status: 403,
            code: '2FA_NOT_ENABLED',
            message: '2FA should be enabled to login on Gladys'
          });
        } else {
          sails.log.error(err);
          next(err);
        }
      });
  },

  isConnected: function(req, res, next) {
    res.json({
      connected: gladys.gateway.isConnected()
    });
  }
};