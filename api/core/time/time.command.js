const moment = require('moment');

module.exports = function command(scope) {
    var result;
    var now = moment().locale(scope.language);

    switch(scope.label) {
        case 'get-time': 
            result = {
                label: 'say-time',
                scope: {
                    '%TIME%': now.format('LT')
                }
            };
        break;
    }

    return Promise.resolve(result);
};