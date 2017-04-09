
module.exports = function command(scope) {

    var event = {
        code: scope.label,
        user: scope.user.id
    };
    
    return gladys.event.create(event)
        .then(() => {

            var response = {};

            switch(scope.label) {
                case 'back-at-home': 
                    response.label = 'user-back-at-home'
                break;

                case 'left-home': 
                    response.label = 'user-leaving-home';
                break;

                case 'going-to-sleep':
                    response.label = 'user-going-to-sleep';
                break;

                case 'wake-up': 
                    response.label = 'user-waking-up';
                break;
            }

            return response;
        });
};