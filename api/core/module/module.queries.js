
module.exports = {
  get: `SELECT module.*, machine.name as machineName
        FROM module
        LEFT JOIN machine ON machine.uuid = module.machine;
  `,
  getById: `
    SELECT module.*, machine.name as machineName
    FROM module
    LEFT JOIN machine ON machine.uuid = module.machine
    WHERE module.id = ?;
  `,
  getFreshInstalledModule: 'SELECT * FROM module WHERE status = 1;' ,
  updateStatusToInstalled: 'UPDATE module SET status = 0 WHERE status = 1;',
  getById: 'SELECT * FROM module WHERE id = ?;',
  delete: 'DELETE FROM module WHERE id = ?;'
};