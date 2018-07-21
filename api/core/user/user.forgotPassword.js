const crypto = require('crypto');
const queries = require('./user.queries.js');

module.exports = function({email}){
    
    // we generate a random token
    var seed = crypto.randomBytes(32);
    var resetPasswordToken = crypto.createHash('sha1').update(seed).digest('hex');
    var resetPasswordUrl = `http://GLADYS_INSTANCE_URL/resetpassword?token=${resetPasswordToken}`;
    
    return gladys.utils.sqlUnique(queries.getByEmail, [email])
        .then((user) => gladys.paramUser.setValue({name: 'RESET_PASSWORD_TOKEN', user: user.id, value: resetPasswordToken}))
        .then(() => {
            sails.log.info(`RESET PASSWORD : The user "${email}" just said he forgot his password. To reset his password, replace "GLADYS_INSTANCE_URL" in this link by the URL of your Gladys instance and open the link in your browser :`);
            sails.log.info(resetPasswordUrl);
        });
};