module.exports = {
  update: function(req, res, next) {
    req.body.id = req.params.id;
    gladys.action
      .updateParam(req.body)
      .then(function(param) {
        return res.json(param);
      })
      .catch(next);
  }
};
