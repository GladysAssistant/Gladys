var queries = require('./stateTypeParam.queries.js');

module.exports = function (stateTypeParam){

    // test if StateTypeParam already exist
    return gladys.utils.sql(queries.getByStateTypeAndVariableName, [stateTypeParam.statetype, stateTypeParam.variablename])
        .then((rows) => {

            // if StateTypeParam already exist, update it
            if(rows.length) return StateTypeParam.update({id: rows[0].id}, stateTypeParam);

            // if not, update it
            return StateTypeParam.create(stateTypeParam);
        })
};