
module.exports = function userSeen(options) {

    // see if user is at home
    return gladys.house.isUserAtHome(options)
        .then((atHome) => {

            // if yes, save event user seen at home
            if(atHome) return gladys.event.create({code: 'user-seen-at-home', user: options.user, house: options.house});

            // if no, save event "back-at-home"
            return gladys.event.create({code: 'back-at-home', user: options.user, house: options.house});
        });
};