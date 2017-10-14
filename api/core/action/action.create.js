
module.exports = function(action){
    var params = action.params || [];
    delete action.params;

    var createdAction;
    return Action.create(action)
        .then((action) => {

            createdAction = action;

            return gladys.actionTypeParam.getByActionType({actiontype: action.action}); 
        })
        .then((actionTypeParams) => {

            // convert the actionTypeParams array into an object
            // so it's easier to get the actionTypeParam id after
            var actionTypeParamDictionnary = {};
            actionTypeParams.forEach(function(actionTypeParam){
                actionTypeParamDictionnary[actionTypeParam.variablename] = actionTypeParam.id;
            });

            // convert params objet to an array of params
            var paramsArray = [];
            for(var prop in params){
                paramsArray.push({
                    action: createdAction.id, 
                    actiontypeparam: actionTypeParamDictionnary[prop],
                    variablename: prop,
                    value: params[prop]
                });
            }
            
            return gladys.action.addParam(paramsArray);
        })
        .then(() => createdAction);
};