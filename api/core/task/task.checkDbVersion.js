
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
        })

        // if the query fails, it means the gladysversion table does not exist
        // it probably mean Gladys do not have the gladysversion table yet. So let's migrate with the first version
        .catch(() => gladys.task.dbMigration('0.0.0'))
};