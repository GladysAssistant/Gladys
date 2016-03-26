
module.exports = {
  getByEmail: 'SELECT * FROM user WHERE email = ?;',
  get: 'SELECT * FROM user LIMIT ? OFFSET ?;' ,
  getAdmin: 'SELECT * FROM user WHERE role = "admin";',
  delete: 'DELETE FROM user WHERE id = ?;' 
};