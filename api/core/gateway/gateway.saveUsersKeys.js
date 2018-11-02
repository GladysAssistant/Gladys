
module.exports = function(usersKeys) {
  return gladys.param.setValue({
    name: 'GLADYS_GATEWAY_USERS_KEYS', 
    value: JSON.stringify(usersKeys),
    type: 'secret'
  });
};