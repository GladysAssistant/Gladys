module.exports = {
  /**
   * @api {get} /brain/classify send a question to gladys
   * @apiName classify
   * @apiGroup Brain
   * @apiPermission authenticated
   *
   * @apiParam {String} q the message for Gladys
   */
  classify: function(req, res, next) {
    gladys.brain
      .classify(req.session.User, { text: req.query.q })
      .then(function(result) {
        return res.json(result);
      })
      .catch(next);
  },

  /**
   * @api {post} /brain/trainnew re-train the sentence model
   * @apiName train
   * @apiGroup Brain
   * @apiPermission authenticated
   *
   */
  trainNew: function(req, res, next) {
    gladys.brain
      .trainNew()
      .then(function() {
        return res.json({ result: 'Brain trained with success' });
      })
      .catch(next);
  }
};
