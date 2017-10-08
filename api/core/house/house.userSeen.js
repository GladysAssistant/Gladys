var queries = require('./house.queries.js');

module.exports = function userSeen(options) {

    // see if user is at home
    return gladys.utils.sql(queries.getLastEventHouseUser, [options.user, options.house])
        .then((rows) => {

            // if user has never had events
            if(rows.length === 0) {
                return gladys.event.create({code: 'user-seen-at-home', user: options.user, house: options.house});
            } 
            
            // if user was not at home
            else if(rows[0].code === 'left-home') {
                return gladys.event.create({code: 'back-at-home', user: options.user, house: options.house});
            } 
            
            // if user is at home, but has never been seen at home
            else if(rows[0].code === 'back-at-home') {
                return gladys.event.create({code: 'user-seen-at-home', user: options.user, house: options.house});
            } 
            
            // else, user has been seen at home so update
            else {
                var newEvent = {
                    id: rows[0].id,
                    datetime: new Date()
                };
                return gladys.event.update(newEvent);
            }
        });
};