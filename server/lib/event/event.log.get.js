const db = require('../../models');

async function get(start = 0, end = 10){
    const logs = await db.EventLog.findAll({
        offset: start,
        limit : end,
    });
    
    return logs.map((log) => log.get({ plain: true }));
}

module.exports = {get};