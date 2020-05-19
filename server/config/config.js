module.exports = {
  development: {
    dialect: 'sqlite',
    storage: process.env.SQLITE_FILE_PATH || './gladys-development.db',
    logging: false,
    operatorsAliases: false,
    define: {
      underscored: true,
      freezeTableName: true,
    },
    retry: {
      match: [/SQLITE_BUSY/],
      name: 'query',
      max: 5,
    },
    backupsFolder: './gladys-backups',
    gladysGatewayServerUrl: process.env.GLADYS_GATEWAY_SERVER_URL || 'https://api.gladysgateway.com',
    dockerImage: 'gladysassistant/gladys-4-playground',
    tempFolder: '/tmp/gladys',
  },
  test: {
    dialect: 'sqlite',
    storage: process.env.SQLITE_FILE_PATH || ':memory:',
    operatorsAliases: false,
    logging: false,
    define: {
      underscored: true,
      freezeTableName: true,
    },
    retry: {
      match: [/SQLITE_BUSY/],
      name: 'query',
      max: 5,
    },
    backupsFolder: './gladys-backups',
    gladysGatewayServerUrl: process.env.GLADYS_GATEWAY_SERVER_URL || 'https://api.gladysgateway.com',
    dockerImage: 'gladysassistant/gladys-4-playground',
    tempFolder: '/tmp/gladys',
  },
  production: {
    dialect: 'sqlite',
    storage: process.env.SQLITE_FILE_PATH || './gladys-production.db',
    operatorsAliases: false,
    logging: false,
    define: {
      underscored: true,
      freezeTableName: true,
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
