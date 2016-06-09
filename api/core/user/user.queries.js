
module.exports = {
  getByEmail: 'SELECT * FROM user WHERE email = ?;',
  get: 'SELECT * FROM user LIMIT ? OFFSET ?;' ,
  getAdmin: 'SELECT * FROM user WHERE role = "admin";',
  getById: 'SELECT * FROM user WHERE id = ?;',
  delete: 'DELETE FROM user WHERE id = ?;' 
};