const db = require('../../models');

async function get(start = 0, number = 10){
    const logs = await db.EventLog.findAll({
        offset: start,
        limit : number,
        order : [['created_at', 'DESC']]
    });
    
    const count = await db.EventLog.count()

    return {data : logs.map((log) => log.get({ plain: true })), total : count, start : start + 1, end : start + logs.length};
}

module.exports = {get};