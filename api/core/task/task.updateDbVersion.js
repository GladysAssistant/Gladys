
module.exports = function updateDbVersion(newVersion){
    var data = {
        version: newVersion,
        datetime: new Date()
    };
    return GladysVersion.create(data);
};