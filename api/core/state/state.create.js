
module.exports = function(state){
    var params = state.params || [];
    delete state.params;

    var createdState;

    // first, we create the state in DB
    return State.create(state)
        .then((state) => {
            createdState = state;

            return gladys.stateTypeParam.getByStateType({statetype: state.state});
        })
        .then((stateTypeParams) => {

            // convert the stateTypeParams array into an object
            // so it's easier to get the stateTypeParam id after
            var stateTypeParamDictionnary = {};
            stateTypeParams.forEach(function(stateTypeParam){
                stateTypeParamDictionnary[stateTypeParam.variablename] = stateTypeParam.id;
            });

            // convert params objet to an array of params
            var paramsArray = [];
            for(var prop in params){
                paramsArray.push({
                    state: createdState.id, 
                    statetypeparam: stateTypeParamDictionnary[prop],
                    variablename: prop,
                    value: params[prop]
                });
            }
            
            return gladys.stateParam.create(paramsArray);
        })
        .then(() => createdState);
};