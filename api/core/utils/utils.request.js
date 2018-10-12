var request = require('request');

module.exports = function(param) {

  // handle scenarios
  if(param.params) {
    param = param.params; 
  }

  // get request, return JS is json, else resolve raw body
  return new Promise(function(resolve, reject) {

    // we parse the JSON body from scenario 
    if(param.json === 'true' && param.body && typeof param.body === 'string' ) {
      try{
        param.body = JSON.parse(param.body);
        param.json = true;
      }  catch(e) {
        return reject(e);
      }
    }

    request(param, function(err, response, body) {
      if (err) {
        return reject(err); 
      }

      try {
        var json = JSON.parse(body);
        resolve(json);
      } catch (e) {
        resolve(body);
      }
    });
  });
};
