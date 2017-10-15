
/**
 * Delete existing scenario and import new one
 */
module.exports = function updateScenario(id, params){
    sails.log.info(`Gladys : scenario : update : Deleting scenario ID n°${id}`);
    return gladys.launcher.delete({id: id})
        .then(() => {
            sails.log.info(`Gladys : scenario : update : Recreating scenario with code = ${params.trigger.code}`);
            params.trigger.id = id;
            return gladys.scenario.import(params)
        });
};