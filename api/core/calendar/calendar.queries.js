module.exports = {
    
    getCalendarByExternalId: 'SELECT * FROM calendar WHERE externalid = ?;',
    getByService: 'SELECT * FROM calendar WHERE service = ?;',
    getCalendarEventByExternalId: 'SELECT * FROM calendarevent WHERE externalid = ?;',
    authorizationCalendar: `SELECT * FROM calendar WHERE id = ? and user = ?;`,
    authorizationCalendarEvent: `
        SELECT * FROM calendarevent 
        INNER JOIN calendar ON (calendarevent.calendar = calendar.id)
        WHERE calendarevent.id = ?
        AND calendar.user = ?;
     `,
    deleteCalendar: 'DELETE FROM calendar WHERE id = ?;',
    deleteEventFromCalendar: 'DELETE FROM calendarevent WHERE calendar = ?;',
    deleteEvent: `DELETE FROM calendarevent WHERE id = ?;`,
    
    getCalendars: `SELECT * FROM calendar WHERE user = ? LIMIT ? OFFSET ?;`,

    getNextEvents: `
        SELECT calendarevent.* 
        FROM calendarevent
		INNER JOIN calendar ON (calendarevent.calendar = calendar.id)
		WHERE user = ? 
		AND start > SYSDATE()
		AND calendar.active = 1 
		ORDER BY start 
		LIMIT ?
        OFFSET ?;
    `,

    getNextEventUser: `
        SELECT calendarevent.* 
        FROM calendarevent
		INNER JOIN calendar ON (calendarevent.calendar = calendar.id)
		WHERE user = ? 
		AND start > SYSDATE()
		AND calendar.active = 1 
		ORDER BY start 
		LIMIT 1;
    `,

    getFirstEventTodayUser: `
        SELECT calendarevent.* 
        FROM calendarevent
		INNER JOIN calendar ON (calendarevent.calendar = calendar.id)
		WHERE user = ? 
		AND calendar.active = 1
        AND DATE(start) = DATE(NOW())
		ORDER BY start 
		LIMIT 1;
    `,
    
    getEventsDates: `
        SELECT calendarevent.*
        FROM calendarevent
		INNER JOIN calendar ON(calendarevent.calendar = calendar.id)
		WHERE user = ? 
		AND end > ?
        AND start <= ?
		AND calendar.active = 1 
		ORDER BY start;
    `,

    getAllEvents: `
        SELECT calendarevent.*
        FROM calendarevent
        INNER JOIN calendar ON(calendarevent.calendar = calendar.id)
        WHERE user = ?
        AND calendar.active = 1 
        ORDER BY start;
    `,
    
    getAllCalendarService: 
    `
        SELECT DISTINCT service FROM calendar;
    `
};
