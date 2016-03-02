module.exports = {
    getNotificationTypes: `
    SELECT * FROM notificationtype nt
    JOIN notificationuser nu ON (nt.id = nu.notificationtype)
    WHERE nu.user = ?
    ORDER BY nu.priority; 
  `
};
