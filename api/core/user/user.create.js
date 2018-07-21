module.exports = function create(user) {

    // check if password size is good
    if (user.password && user.password.length < 8) {
        return Promise.reject(new Error('PASSWORD_SIZE_TOO_LOW'));
    }

    // creating in DB the user
    return User.create(user)
        .then((user) => {

            // remove password from user object
            delete user.password;

            // generating a JsonWebToken
            return [gladys.user.generateToken(user), user];
        })
        .spread((token, user) => {
            user.token = token;

            return user;
        });
};