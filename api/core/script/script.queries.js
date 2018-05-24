module.exports = {
    deleteScript: 'DELETE FROM script WHERE id = ?;',
    getScripts: 'SELECT * FROM script WHERE user = ?;',
    getById: 'SELECT * FROM script WHERE id = ?;'
};
