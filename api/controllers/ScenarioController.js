
/**
 * ScenarioController
 *
 * @description :: Server-side logic for managing Scenarios
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {

  /**
     * @api {post} /scenario/:id/export Export Scenario
     * @apiName exportScenario
     * @apiGroup Scenario
     * @apiPermission authenticated
     * 
     *
     */
  exportScenario: function(req, res, next){
    gladys.scenario.export(req.params.id)
      .then((data) => res.json(data))
      .catch(next);
  },

   /**
     * @api {post} /scenario Create Scenario from json
     * @apiName importScenario
     * @apiGroup Scenario
     * @apiPermission authenticated
     * 
     *
     */
  importScenario: function(req, res, next){
    gladys.scenario.import(req.body)
      .then((data) => res.status(201).json(data))
      .catch(next);
  },

  /**
     * @api {patch} /scenario/:id Patch Scenario from json
     * @apiName updateScenario
     * @apiGroup Scenario
     * @apiPermission authenticated
     * 
     *
     */
  updateScenario: function(req, res, next){
    gladys.scenario.update(req.params.id, req.body)
      .then((data) => res.status(200).json(data))
      .catch(next);
  },

};

