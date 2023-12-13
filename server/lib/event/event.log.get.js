const db = require('../../models');

async function get(){
    const logs = await db.EventLog.findAll({});
    
    return logs.map((log) => log.get({ plain: true }));
}

module.exports = {get};