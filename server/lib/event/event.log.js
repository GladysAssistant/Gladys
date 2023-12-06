const db = require('../../models');

async function log(type, ref){
    const eventLog = await db.EventLog.create({
        service : type.service,
        type : type.type
    });
    
    return eventLog.get({ plain: true });
}

module.exports = {log};