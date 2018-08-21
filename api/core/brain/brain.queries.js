module.exports = {

     getNotificationTypes: `
        SELECT nt.*, module.machine 
        FROM notificationtype nt
        JOIN notificationuser nu ON (nt.id = nu.notificationtype)
        LEFT JOIN module ON nt.service = module.slug
        WHERE nu.user = ?
        ORDER BY nu.priority; 
    `,

    getAnswers: `
        SELECT text FROM answer WHERE language = ? AND label = ?;
    `
};