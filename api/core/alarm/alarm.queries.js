module.exports = {

    getAlarms: `SELECT * FROM alarm
                WHERE active = 1
		        AND ((dayofweek = -1 AND datetime > SYSDATE()) OR dayofweek <> -1 OR cronrule IS NOT NULL)`,

    deleteAlarm: `DELETE FROM alarm WHERE id = ?`,
    get: 'SELECT * FROM alarm WHERE user = ?;',
    getAutoWakeUpToday: `
        SELECT * FROM alarm
        WHERE autowakeup = 1
        AND dayofweek = (DAYOFWEEK(NOW()) - 1 )
    `
};
