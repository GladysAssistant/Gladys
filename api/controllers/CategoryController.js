/**
 * CategoryController
 *
 * @description :: Server-side logic for managing Categories
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {
  /**
   * get all categories
   */
  index: function(req, res, next) {
    gladys.category
      .get()
      .then(function(categories) {
        return res.json(categories);
      })
      .catch(next);
  },

  getEventTypes: function(req, res, next) {
    gladys.eventType
      .getByCategory({ category: req.params.service })
      .then(function(eventTypes) {
        return res.json(eventTypes);
      })
      .catch(next);
  }
};
