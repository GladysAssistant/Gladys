module.exports = {
  development: {
    dialect: 'sqlite',
    storage: process.env.SQLITE_FILE_PATH || './gladys-development.db',
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
    backupsFolder: './gladys-backups',
    servicesFolder: (service) => `~/gladys/gladys-services/${service}`,
    gladysGatewayServerUrl: process.env.GLADYS_GATEWAY_SERVER_URL || 'https://api.gladysgateway.com',
    dockerImage: 'gladysassistant/gladys-4-playground',
    tempFolder: '~/gladys',
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
    backupsFolder: './gladys-backups',
    servicesFolder: (service) => `/home/rpochet/gladys/gladys-services/${service}`,
    gladysGatewayServerUrl: process.env.GLADYS_GATEWAY_SERVER_URL || 'https://api.gladysgateway.com',
    dockerImage: 'gladysassistant/gladys-4-playground',
    tempFolder: '/tmp/gladys',
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
    servicesFolder: (service) => `${process.env.SERVICES_FOLDER || '/var/lib/gladysassistant'}/${service}`,
    gladysGatewayServerUrl: process.env.GLADYS_GATEWAY_SERVER_URL || 'https://api.gladysgateway.com',
    dockerImage: 'gladysassistant/gladys',
    tempFolder: '/tmp/gladysassistant',
  },
};
