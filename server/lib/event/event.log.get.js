const db = require('../../models');
const { Op } = require('sequelize');
const dayjs = require('dayjs');


async function get(start = 0, number = 10, dateFilterFrom = null, dateFilterTo = null){
    const logs = await db.EventLog.findAll({
        offset: start,
        limit : number,
        order : [['created_at', 'DESC']],
        where : {
            created_at : {
                [Op.lt] : dayjs(dateFilterTo).toDate() || new Date(),
                [Op.gt] : dayjs(dateFilterFrom).toDate()
            }
        }
    });
    
    const count = await db.EventLog.count({
        where : {
            created_at : {
                [Op.lt] : dayjs(dateFilterTo).toDate() || new Date(),
                [Op.gt] : dayjs(dateFilterFrom).toDate()
            }
        }
    })

    return {data : logs.map((log) => log.get({ plain: true })), total : count, start : start + 1, end : start + logs.length};
}

module.exports = {get};