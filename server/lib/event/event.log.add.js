const db = require('../../models');

async function add(type, ref, props){
    const eventLog = await db.EventLog.create({
        service : type.service,
        type : type.type,
        sender_name : ref,
        event_property : props?.join('\n'),
    });
    
    return eventLog.get({ plain: true });
}

module.exports = {add};