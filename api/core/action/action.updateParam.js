
module.exports = function(param){
    var id = param.id;
    delete param.id;
    return ActionParam.update({id}, param);
}