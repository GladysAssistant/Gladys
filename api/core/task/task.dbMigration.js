const semver = require('semver');
const Promise = require('bluebird');

module.exports = function(oldVersion) {
   
    if(!semver.lt(oldVersion, gladys.version)){
        sails.log.info(`Gladys database schema/data is up to date. No migration required. ( DB = ${oldVersion} )`);
        return Promise.resolve();
    }

    sails.log.info(`Gladys database is not up to date with current Gladys version (DB = ${oldVersion}, Gladys = ${gladys.version}), performing migration.`);

    if(semver.lt(oldVersion, '3.7.5')) {

        // first, remove old box + boxType
        return gladys.utils.sql(`DELETE FROM boxtype;`, [])
            .then(() => gladys.utils.sql(`DELETE FROM box;`, []))

            // then, migrate DB schema
            .then(() => Promise.all([
                gladys.utils.sql('ALTER TABLE boxtype DROP COLUMN ngcontroller;').reflect(),
                gladys.utils.sql('ALTER TABLE boxtype DROP COLUMN header;').reflect(),
                gladys.utils.sql('ALTER TABLE boxtype DROP COLUMN html;').reflect(),
                gladys.utils.sql('ALTER TABLE boxtype DROP COLUMN footer;').reflect(),
                gladys.utils.sql('ALTER TABLE boxtype DROP COLUMN type;').reflect(),
                gladys.utils.sql('ALTER TABLE boxtype ADD COLUMN path VARCHAR(255);').reflect(),
                gladys.utils.sql('ALTER TABLE box ADD COLUMN params longtext;').reflect()
            ]))
            .then(() => gladys.utils.sql(`
                CREATE TABLE gladysversion (
                    version varchar(255) DEFAULT NULL,
                    datetime datetime DEFAULT NULL,
                    id int(10) unsigned NOT NULL AUTO_INCREMENT,
                    createdAt datetime DEFAULT NULL,
                    updatedAt datetime DEFAULT NULL,
                    PRIMARY KEY (id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
            `).reflect())
            .then(() => gladys.update.getBoxTypes())
            .then(() => gladys.task.updateDbVersion('3.7.5'))
            .then(() => gladys.task.dbMigration('3.7.5'));
    }

    if(semver.lt(oldVersion, '3.7.8')) {
        return gladys.utils.sql(`ALTER TABLE alarm ADD COLUMN isWakeUp tinyint(1) DEFAULT NULL;`).reflect()
            .then(() => gladys.task.updateDbVersion('3.7.8'))
            .then(() => gladys.task.dbMigration('3.7.8'))
    }

    if(semver.lt(oldVersion, '3.8.1')) {
        return gladys.utils.sql(`ALTER TABLE devicetype ADD COLUMN lastValue float DEFAULT NULL;`).reflect()
            .then(() => gladys.utils.sql(`ALTER TABLE devicetype ADD COLUMN lastValueDatetime datetime DEFAULT NULL;`).reflect())
            .then(() => gladys.deviceState.refreshDeviceTypeLastValue())
            .then(() => gladys.task.updateDbVersion('3.8.1'))
            .then(() => gladys.task.dbMigration('3.8.1'));
    }

    if(semver.lt(oldVersion, '3.9.0')) {

        // device
        return gladys.utils.sql(`ALTER TABLE device ADD COLUMN machine varchar(255) DEFAULT NULL;`).reflect()

            // machine
            .then(() => gladys.utils.sql(`ALTER TABLE machine DROP COLUMN host;`).reflect())
            .then(() => gladys.utils.sql(`ALTER TABLE machine ADD COLUMN room integer DEFAULT NULL;`).reflect())
            .then(() => gladys.utils.sql(`ALTER TABLE machine ADD COLUMN lastSeen datetime DEFAULT NULL;`).reflect())

            // module
            .then(() => gladys.utils.sql(`ALTER TABLE module ADD COLUMN lastSeen datetime DEFAULT NULL;`).reflect())
            .then(() => gladys.utils.sql(`ALTER TABLE module ADD COLUMN machine varchar(255) DEFAULT NULL;`).reflect())

            // param 
            .then(() => gladys.utils.sql(`ALTER TABLE param ADD COLUMN description varchar(255) DEFAULT NULL;`).reflect())
            .then(() => gladys.utils.sql(`ALTER TABLE param ADD COLUMN type varchar(255) DEFAULT NULL;`).reflect())
            .then(() => gladys.utils.sql(`ALTER TABLE param ADD COLUMN module integer DEFAULT NULL;`).reflect())

            // finishing migration
            .then(() => gladys.task.updateDbVersion('3.9.0'))
            .then(() => gladys.task.dbMigration('3.9.0'));
    }

    // default, we save in DB the current version of Gladys
    return gladys.task.updateDbVersion(gladys.version);
};