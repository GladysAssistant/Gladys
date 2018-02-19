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
            .then(() => gladys.update.getBoxTypes())
            .then(() => gladys.task.updateDbVersion('3.7.5'))
            .then(() => gladys.task.dbMigration('3.7.5'));
    }
};