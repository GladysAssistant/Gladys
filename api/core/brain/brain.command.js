
module.exports = function command(scope) {

    var response = {};

    switch(scope.label) {

        case 'thank-you':
            response.label = 'you-are-welcome';
        break;

        case 'greeting':
            response.label = 'greeting';
        break;

        case 'whats-up':
            response.label = 'i-am-fine'
        break;

        default:
            response.label = 'no-command-detected';
        break
    }

    return Promise.resolve(response);
};