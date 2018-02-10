
module.exports = function checkDbVersion() {
    return gladys.utils.sql('SELECT * FROM gladysversion ORDER BY datetime DESC LIMIT 1', [])
        .then((versions) => {

            var dbVersion;
            
            if(versions.length === 0) {
                dbVersion = '0.0.0';
            } else {
                dbVersion = versions[0].version;
            }

            return gladys.task.dbMigration(dbVersion);
        });
};