
module.exports = function (state){
    var id = state.id;
    delete state.id;
    return State.update({id}, state);
};