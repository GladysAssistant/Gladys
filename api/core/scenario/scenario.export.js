const queries = require('./scenario.queries.js');
const Promise = require('bluebird');

module.exports = function exportScenario(id){

    var promises = [
        gladys.utils.sqlUnique(queries.getLauncher, [id]),
        gladys.utils.sql(queries.getStates, [id]),
        gladys.utils.sql(queries.getActions, [id])
    ];

    return Promise.all(promises)
        .spread((launcher, states, actions) => {

            return {
                trigger: launcher, 
                conditions: normalize(states), 
                actions: normalize(actions)
            };
        });
};

function normalize(data) {
    var newArray = [];
    var dictionnary = {};
    data.forEach(function(elem){
        if(dictionnary[elem.id]){
            dictionnary[elem.id].params[elem.variablename] = elem.value;
        } else {
            dictionnary[elem.id] = {
                code: elem.code,
                params: {
                    [elem.variablename]: elem.value
                }
            };
            newArray.push(dictionnary[elem.id]);
        }
    });
    return newArray;
}