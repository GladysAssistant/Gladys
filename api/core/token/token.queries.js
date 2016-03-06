
module.exports = {
  getTokenUser: `
    SELECT user.* FROM user
    INNER JOIN token ON token.user = user.id
    WHERE token.value = ? AND active = 1;
  `  
};