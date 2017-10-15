/**
 * SentenceController
 *
 * @description :: Server-side logic for managing sentences
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {
    index(req, res, next) {
        gladys.sentence.get(req.query)
          .then(function(events){
              return res.json(events);
          })
          .catch(next);
    },
	update(req, res, next) {
        req.body.id = req.params.id;
        gladys.sentence.update(req.body)
        .then(function(sentence){
            return res.json(sentence);
        })
        .catch(next);
    },
    getLabels(req, res, next) {
        gladys.sentence.getLabels()
        .then(function(sentence){
            return res.json(sentence);
        })
        .catch(next);
    }
};

