// In development, the database and whatever Gladys stores next to it (DuckDB, the backups,
// the storage of the Matter controller...) go to this single folder, which git and nodemon
// ignore. A feature that needs to persist files must derive its path from the folder of
// `storage`, so that it lands there without any new ignore rule.
const DEVELOPMENT_DATA_FOLDER = './gladys-data';

module.exports = {
  development: {
    dialect: 'sqlite',
    storage: process.env.SQLITE_FILE_PATH || `${DEVELOPMENT_DATA_FOLDER}/gladys-development.db`,
    // The development data used to live at the root of `server/`: it is moved to the data
    // folder at startup (see utils/prepareDataFolder.js). Only the default location is
    // migrated: with a custom SQLITE_FILE_PATH, nothing is moved.
    legacyDataFolder: process.env.SQLITE_FILE_PATH ? null : '.',
    logging: false,
    define: {
      underscored: true,
      freezeTableName: true,
      createdAt: 'created_at', // Hack https://github.com/sequelize/sequelize/issues/11225
      updatedAt: 'updated_at',
    },
    retry: {
      match: [/SQLITE_BUSY/],
      name: 'query',
      max: 5,
    },
    backupsFolder: `${DEVELOPMENT_DATA_FOLDER}/backups`,
    gladysGatewayServerUrl: process.env.GLADYS_GATEWAY_SERVER_URL || 'https://api.gladysgateway.com',
    dockerImage: 'gladysassistant/gladys-4-playground',
    tempFolder: process.env.TEMP_FOLDER || '/tmp/gladys',
  },
  test: {
    dialect: 'sqlite',
    storage: process.env.SQLITE_FILE_PATH || './gladys-test.db',
    logging: false,
    define: {
      underscored: true,
      freezeTableName: true,
      createdAt: 'created_at', // Hack https://github.com/sequelize/sequelize/issues/11225
      updatedAt: 'updated_at',
    },
    retry: {
      match: [/SQLITE_BUSY/],
      name: 'query',
      max: 5,
    },
    // Both folders are overridable so each mocha parallel worker gets its own
    // (see test/setup-env.js): the backup/restore and upgrade tests write real
    // files there and would otherwise delete each other's across workers.
    backupsFolder: process.env.BACKUP_FOLDER || './gladys-backups',
    gladysGatewayServerUrl: process.env.GLADYS_GATEWAY_SERVER_URL || 'https://api.gladysgateway.com',
    dockerImage: 'gladysassistant/gladys-4-playground',
    tempFolder: process.env.TEMP_FOLDER || '/tmp/gladys',
  },
  production: {
    dialect: 'sqlite',
    storage: process.env.SQLITE_FILE_PATH || './gladys-production.db',
    logging: false,
    define: {
      underscored: true,
      freezeTableName: true,
      createdAt: 'created_at', // Hack https://github.com/sequelize/sequelize/issues/11225
      updatedAt: 'updated_at',
    },
    retry: {
      match: [/SQLITE_BUSY/],
      name: 'query',
      max: 5,
    },
    backupsFolder: process.env.BACKUP_FOLDER || '/var/lib/gladysassistant/backups',
    gladysGatewayServerUrl: process.env.GLADYS_GATEWAY_SERVER_URL || 'https://api.gladysgateway.com',
    dockerImage: 'gladysassistant/gladys',
    tempFolder: '/tmp/gladysassistant',
  },
};
