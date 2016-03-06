var crypto = require('crypto');

module.exports = function create(params){
  var seed = crypto.randomBytes(20);
  var token = crypto.createHash('sha1').update(seed).digest('hex');

  var tokenObj = {
    name : params.name,
    value: token,
    user : params.user.id 
  };

  return Token.create(tokenObj);
};