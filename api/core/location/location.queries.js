
module.exports = {

    // need to get the most recent location of all users
    // we order first by datetime, but as it's not a primary key there can be two same datetime.
    // So then get the MAX(id) of the MAX(datetime) to get only the most recent id
    getLastLocationUser: 
    `
        SELECT MAX(location.id) as id, location.datetime, latitude, longitude, altitude, accuracy, firstname, lastname, user.id as user
        FROM 
            (
                 SELECT MAX(datetime) as datetime, user
                 FROM location
                 GROUP BY user
            ) as locationUsers
        JOIN location ON location.datetime = locationUsers.datetime
        JOIN user ON location.user = user.id
        GROUP BY location.user, location.datetime, latitude, longitude, altitude, accuracy, firstname, lastname;
    `,
    getLastLocationOneUser: `SELECT * FROM location WHERE user = ? AND accuracy <= ? ORDER BY datetime DESC LIMIT 1;`,
    getLocationsUserPaginated: `
        SELECT * FROM location WHERE user = ? 
        AND accuracy <= ? 
        ORDER BY datetime DESC 
        LIMIT ? OFFSET ?;
    `,
    getLocationsUserPaginatedBefore: `
        SELECT * FROM location WHERE user = ? 
        AND accuracy <= ?
        ORDER BY datetime DESC 
        LIMIT ? OFFSET ?;
    `
};