module.exports = {

    getAlarms: `SELECT * FROM alarm
                WHERE active = 1
		        AND ((dayofweek = -1 AND datetime > SYSDATE()) OR dayofweek <> -1 )`,

    deleteAlarm: `DELETE FROM alarm WHERE id = ?`

};
