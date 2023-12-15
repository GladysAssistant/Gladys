const db = require('../../models');

async function get(start = 0, end = 10){
    const logs = await db.EventLog.findAll({
        offset: start,
        limit : end,
        order : [['created_at', 'DESC']]
    });
    
    const count = await db.EventLog.count()

    return {data : logs.map((log) => log.get({ plain: true })), total : count};
}

module.exports = {get};