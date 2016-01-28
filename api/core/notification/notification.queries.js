module.exports = {
  getNotificationTypes: `
    SELECT * FROM notificationtype
    WHERE user = ?
    ORDER BY priority; 
  `
};