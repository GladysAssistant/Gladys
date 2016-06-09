var request = require('request');

module.exports = function(param) {

    // get request, return JS is json, else resolve raw body
    return new Promise(function(resolve, reject) {
        request(param, function(err, response, body) {
            if (err) return reject(err);

            try {
                var json = JSON.parse(body);
                resolve(json);
            } catch (e) {
                resolve(body);
            }
        });
    });
};
